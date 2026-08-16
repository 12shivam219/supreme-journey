"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const initialEmail = process.env.INITIAL_PARENT_EMAIL || 'admin@tracker.local';
    const initialPassword = process.env.INITIAL_PARENT_PASSWORD || 'ParentSecurePassword123!';
    const initialName = process.env.INITIAL_PARENT_NAME || 'Parent Administrator';
    const existingUser = await prisma.user.findUnique({
        where: { email: initialEmail },
    });
    if (!existingUser) {
        const passwordHash = await bcrypt_1.default.hash(initialPassword, 10);
        const parentUser = await prisma.user.create({
            data: {
                role: 'parent',
                name: initialName,
                email: initialEmail,
                passwordHash: passwordHash,
            },
        });
        console.log(`[Seed Success] Initial parent user created: ${parentUser.email} (ID: ${parentUser.id})`);
    }
    else {
        console.log(`[Seed Info] Initial parent user already exists: ${existingUser.email}`);
    }
}
main()
    .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
