import { randomUUID } from "crypto";
import { SumObj, WsMsg, addListOfTensors, createConvModel, prepMsg, weightAsArray } from "federated-learning";
import { ServerWebSocket } from "bun";
import * as tf from '@tensorflow/tfjs';

type ModelLayersStore = {
    model: ReturnType<typeof createConvModel>,
    id: string,
    time: Date,
    children: ModelLayersStore[]
}
export const modelLayersStore: ModelLayersStore = {
    model: createConvModel(),
    id: randomUUID(),
    time: new Date(),
    children: []
}
let newestLayer: ModelLayersStore = modelLayersStore

const parties: {
    [partyId: string]: {
        sum?: SumObj
        participants: {
            partialSum?: SumObj
            publicKey: string,
            socket: ServerWebSocket
        }[]
    }
} = {}

const modelShapes = createConvModel().getWeights().map(w => w.shape)

const enroll = (publicKey: string, socket: ServerWebSocket<any>): string => {
    const existingParty = Object.keys(parties).find(partyId => parties[partyId].participants.length < 3)

    if (existingParty) {
        parties[existingParty].participants.push({ publicKey, socket })
        return existingParty
    }

    const id = randomUUID()
    parties[id] = {
        participants: [{ publicKey, socket }]
    }

    return id
}

export const makeWsServer = (port = 4000) => Bun.serve({
    port: process.env.PORT || port,
    fetch(req, server) {
        const success = server.upgrade(req);
        if (success) {
            // Bun automatically returns a 101 Switching Protocols
            // if the upgrade succeeds
            return undefined;
        }

        // handle HTTP request normally
        return Response.json({
            error: "Could not upgrade protocol"
        });
    },
    websocket: {
        // this is called when a message is received
        async message(ws, message) {
            try {
                const m = WsMsg.parse(JSON.parse(message.toString()))
                if (m.methodName === "getModel") {
                    const weightData = await weightAsArray(newestLayer.model);
                    const weightShapes = modelLayersStore.model.getWeights().map(w => w.shape);

                    ws.send(prepMsg({
                        methodName: "model",
                        model: {
                            weightData,
                            weightShapes
                        }
                    }));
                }
                else if (m.methodName === "enroll") {
                    // Send over configuration
                    ws.send(prepMsg({
                        methodName: "configuration",
                        numberOfFriends: 3
                    }));

                    const partyId = enroll(m.encodedPublicKey, ws)

                    // Let other participants know of the new one
                    parties[partyId].participants.map(p => {
                        if (p.publicKey === m.encodedPublicKey) {
                            // No need to notify the party who just enrolled
                            return
                        }

                        // Notify other participants of the new friend.
                        p.socket.send(prepMsg({
                            methodName: "enroll",
                            encodedPublicKey: m.encodedPublicKey
                        }))

                        // Notify other participants of the new friend.
                        ws.send(prepMsg({
                            methodName: "enroll",
                            encodedPublicKey: p.publicKey
                        }))
                    })
                } else if (m.methodName === "sendPiece") {
                    const receiver = Object.values(parties)
                        .map(p => p.participants)
                        .flat()
                        .find(p => p.publicKey === m.to)

                    // Relay message
                    receiver?.socket.send(prepMsg(m))
                } else if (m.methodName === "sendPartialSum") {

                    const from = Object.values(parties)
                        .map(p => p.participants)
                        .flat()
                        .find(p => p.publicKey === m.from)


                    if (from) {
                        from.partialSum = m.partialSum
                    }

                    // When all partial sums are received, sum up
                    Object.values(parties).forEach(party => {
                        const allPartialSumsAreIn = !party.participants.find(p => p.partialSum === undefined)

                        if (allPartialSumsAreIn && !party.sum) {

                            const sumOfPartials = party.participants.map(p => ({
                                ...p.partialSum,
                                modelWeights: p.partialSum?.modelWeights.map((mw, i) => tf.tensor(mw, modelShapes[i]))
                            })).reduce((p, participant) => {
                                if (!participant?.trainedBatches || !p?.trainedBatches) {
                                    throw Error("Missing data")
                                }
                                return {
                                    trainedBatches: p.trainedBatches + participant.trainedBatches,
                                    modelWeights: addListOfTensors(p?.modelWeights!, participant?.modelWeights!)
                                }
                            })



                            // Setting new model

                            const newModel = createConvModel()

                            const currentTensors = newestLayer.model.getWeights()

                            const ws = sumOfPartials.modelWeights?.map((t, i) => t.div(3).add(currentTensors[i]))
                            if (!ws) {
                                throw new Error("Could not calculate new weights")
                            }
                            newModel.setWeights(ws)


                            const newLayer = {
                                id: randomUUID(),
                                model: newModel,
                                children: [],
                                time: new Date()
                            }
                            modelLayersStore.children.push(newLayer)
                            newestLayer = newLayer
                            console.log("Added new layer to the model")

                        } else {
                            // Still missing parts
                        }
                    })
                }
            } catch (e) {
                console.log("Got error: ", message.slice(0, 100), e)
                ws.send(prepMsg({
                    methodName: "error",
                    reason: "Parse Error"
                }));
            }

        },
        async close() {

        }
    },
});

const flWsServer = makeWsServer()
console.log(`Server listening on ${flWsServer.port}`)