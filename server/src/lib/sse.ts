import { FastifyReply } from 'fastify';

type Connection = {
    id: string;
    reply: FastifyReply;
};

export class SSEManager {
    private connections: Connection[] = [];

    constructor() {
        // Start keep-alive interval
        setInterval(() => this.broadcastComment('ping'), 15000);
    }

    addConnection(reply: FastifyReply) {
        const id = Math.random().toString(36).substring(7);
        this.connections.push({ id, reply });

        // Remove connection on close
        reply.raw.on('close', () => {
            this.removeConnection(id);
        });

        return id;
    }

    removeConnection(id: string) {
        this.connections = this.connections.filter(c => c.id !== id);
    }

    sendToClient(reply: FastifyReply, event: string, data: any) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        reply.raw.write(message);
    }

    broadcast(event: string, data: any) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        this.connections.forEach(c => {
            try {
                c.reply.raw.write(message);
            } catch (e) {
                // Connection might differ
                console.error(`Error broadcasting to ${c.id}`, e);
                this.removeConnection(c.id);
            }
        });
    }

    broadcastComment(comment: string) {
        this.connections.forEach(c => {
            try {
                c.reply.raw.write(`: ${comment}\n\n`);
            } catch (e) {
                this.removeConnection(c.id);
            }
        });
    }

    getConnectionCount() {
        return this.connections.length;
    }
}
