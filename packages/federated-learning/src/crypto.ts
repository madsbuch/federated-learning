import { Buffer } from 'buffer';

// Define the encryption algorithm details
export const algorithm = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
};

export const aesAlgorithm = (iv: Uint8Array) => ({
    name: "AES-GCM",
    length: 256,
    iv
})

type EncrypedPackage = { key: string, message: string, iv: number[] }

/**
 * Takes a message, encrypts and encodes it so that it ban be send over the wire
 * 
 * @param publicKeyEncoded 
 * @param element 
 * @returns 
 */
export const encryptAndEncode = async (publicKeyEncoded: string, element: string): Promise<EncrypedPackage> => {
    const publicKeyDecoded = await crypto.subtle.importKey("jwk", JSON.parse(atob(publicKeyEncoded)), algorithm, true, ["encrypt"])
    const writeBuffer = Buffer.from(element)

    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Make an AES key
    const messageKey = await crypto.subtle.generateKey(aesAlgorithm(iv), true, ["encrypt", "decrypt"]);
    const exportedKey = await crypto.subtle.exportKey("raw", messageKey)
    const encryptedKey = await crypto.subtle.encrypt(algorithm, publicKeyDecoded, exportedKey);
    const encrypedMessage = await crypto.subtle.encrypt(aesAlgorithm(iv), messageKey, writeBuffer);

    return {
        key: Buffer.from(encryptedKey).toString("base64"),
        message: Buffer.from(encrypedMessage).toString("base64"),
        iv: [...iv]
    }
}

export const decryptAfterDecode = async ({ privateKey }: CryptoKeyPair, encodedAndEncrypted: EncrypedPackage): Promise<string> => {
    const decodedMessage = Buffer.from(encodedAndEncrypted.message, "base64")
    const decodedKey = Buffer.from(encodedAndEncrypted.key, "base64")
    const iv = Uint8Array.from(encodedAndEncrypted.iv)

    const decryptedRawKey = await crypto.subtle.decrypt(algorithm, privateKey, decodedKey);
    const importedKey = await crypto.subtle.importKey("raw", decryptedRawKey, aesAlgorithm(iv), true, ["decrypt"])

    const decryptedMessage = await crypto.subtle.decrypt(aesAlgorithm(iv), importedKey, decodedMessage);
    return Buffer.from(decryptedMessage).toString()
}

export const encodePublicKey = async ({ publicKey }: CryptoKeyPair) => {
    return btoa(JSON.stringify(await crypto.subtle.exportKey("jwk", publicKey)))
}