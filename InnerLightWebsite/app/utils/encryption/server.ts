import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface EncryptedMessage {
    iv: string;
    content: string;
    tag: string;
}

export class EncryptionManager {
    private key: Buffer;

    constructor(secretKey: string) {
        if(!secretKey) throw new Error('Encryption key not initialized');

        // Use SHA-256 hash of the secret key for conistency
        this.key = crypto.createHash('sha256').update(secretKey).digest();
    }

    encrypt(message: string): EncryptedMessage {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        let encrypted = cipher.update(message, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const tag = cipher.getAuthTag();

        return {
            iv: iv.toString('base64'),
            content: encrypted,
            tag: tag.toString('base64')
        };
    }

    decrypt(encryptedMessage: EncryptedMessage): string {
        const iv = Buffer.from(encryptedMessage.iv, 'base64');
        const tag = Buffer.from(encryptedMessage.tag, 'base64');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedMessage.content, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
