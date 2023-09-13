import * as tf from '@tensorflow/tfjs';
import { Server } from "bun";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { PrivateSum, PrivateSumCallbacks, createConvModel } from "federated-learning";
import { makeWsServer, modelLayersStore } from "../src/index";

let server: Server

beforeEach(() => {
    server = makeWsServer(Math.floor(Math.random() * 30_000) + 10_000)
})

afterEach(() => {
    server.stop()
})

test("Can connect to server", () => {
    return new Promise<void>((resolve) => {
        const ws = new WebSocket(`ws://${server.hostname}:${server.port}`)
        ws.addEventListener("open", () => {
            resolve()
        })
    })
})

const nullCb: PrivateSumCallbacks = {
    onNewParticipant: () => null,
    onReady: () => null,
    onRemovedParticipant: () => null
}

test("Can play out protocol", async () => {

    let enrollments = 0

    const cb = { ...nullCb, onNewParticipant: () => { enrollments++ } }

    const party1 = new PrivateSum(cb, `ws://${server.hostname}:${server.port}`)
    const party2 = new PrivateSum(cb, `ws://${server.hostname}:${server.port}`)
    const party3 = new PrivateSum(cb, `ws://${server.hostname}:${server.port}`)

    await party1.init()
    await party1.enroll()

    await party2.init()
    await party2.enroll()

    await party3.init()
    await party3.enroll()

    // Give time to messages to propagate
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Each participants receive the others participants enrollments
    expect(enrollments).toBe(6)


    await party1.start({
        trainedBatches: 10,
        modelWeights: createConvModel().getWeights()
    })
    await party2.start({
        trainedBatches: 10,
        modelWeights: createConvModel().getWeights()
    })
    await party3.start({
        trainedBatches: 10,
        modelWeights: createConvModel().getWeights()
    })

    // Give time to messages to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(modelLayersStore.children).toHaveLength(1)
})