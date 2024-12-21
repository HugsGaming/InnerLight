import { Buffer } from 'buffer'

export interface EncryptedMessage {
    iv: string;
    content: string;
}

export class EncryptionManager {
    private key: CryptoKey | null = null;

    /**
     * Initializes the encryption manager with a password. The password is used to derive an
     * AES-GCM encryption key using PBKDF2. The derived key is then used for encryption and decryption.
     * @param {string} password - The password to use for deriving the encryption key.
     * @returns {Promise<void>} - A promise that resolves when the encryption manager is initialized.
     */
    async initialize(password: string) : Promise<void> {
        // Derive encryption key from password using PBKDF2
        const encoder = new TextEncoder();
        const salt = encoder.encode(process.env.ENCRYPTION_SALT); // In production, use a proper salt management strategy
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            {name: 'PBKDF2'},
            false,
            ['deriveBits', 'deriveKey']
        );

        this.key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            {name: 'AES-GCM', length: 256},
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a given message using AES-GCM with the encryption key derived in the constructor.
     * @param {string} message - The message to encrypt.
     * @returns {Promise<EncryptedMessage>} - A promise that resolves with an object containing the
     * base64 encoded IV and the base64 encoded ciphertext.
     * @throws {Error} - If the encryption key has not been initialized.
     */
    async encrypt(message: string): Promise<EncryptedMessage> {
        if (!this.key) throw new Error('Encryption key not initialized');

        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = encoder.encode(message);

        const encryptedContent = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM', 
                iv
            },
            this.key,
            encodedMessage
        );

        return {
            iv: Buffer.from(iv).toString('base64'),
            content: Buffer.from(encryptedContent).toString('base64')
        }
    }

    /**
     * Decrypts a given message using AES-GCM with the encryption key derived in the constructor.
     * @param {EncryptedMessage} encryptedMessage - The message to decrypt.
     * @returns {Promise<string>} - A promise that resolves with the decrypted message.
     * @throws {Error} - If the encryption key has not been initialized.
     */
    async decrypt(encryptedMessage: EncryptedMessage): Promise<string> {
        if (!this.key) throw new Error('Encryption key not initialized');

        const iv = Buffer.from(encryptedMessage.iv, 'base64');
        const encryptedContent = Buffer.from(encryptedMessage.content, 'base64');

        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM', 
                iv
            },
            this.key,
            encryptedContent
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    }
}

export const encryptionManager = new EncryptionManager();
