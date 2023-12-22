import { FastifyInstance } from "fastify"
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from "crypto"
import { checkSessionIdExists } from "../middleware/chech-session-is-exists"

export async function transactionsRoutes(app: FastifyInstance) {

    app.addHook('preHandler', async (req, rep) => {
        console.log(`[${req.method}] ${req.url}`)
    })

    // Criar
    app.post('/', async (req, rep) => {
        
        const createtransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit'])
        })
        const { title, amount, type } = createtransactionBodySchema.parse(req.body)
        
        // cookies
        let sessionId = req.cookies.sessionID
        console.log({sessionId})
        if (!sessionId) {
            sessionId = randomUUID()

            rep.cookie('sessionID', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7   // 7 days
            })
        }

        try {
            await knex('transactions').insert({
                id: randomUUID(),
                title,
                amount: type === 'credit' ? amount : amount * -1,
                session_id: sessionId
            });

            console.log('201 Created')

            return rep.status(201).send('Created');
        } catch (error) {
            console.error('Erro ao inserir transação no banco de dados:', error);
            return rep.status(500).send({ error });
        }
        
    })

    // Listar
    app.get('/', {preHandler: [checkSessionIdExists]}, async (req) => {
        
        const { sessionID } = req.cookies
        const transactions = await knex('transactions')
        .where('session_id', sessionID)
        .select()

        return { transactions }
    })

    // Buscar por ID
    app.get('/:id', {preHandler: [checkSessionIdExists]},async (req) => {

        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })
        const { id } = getTransactionParamsSchema.parse(req.params)
        const { sessionID } = req.cookies
        
        const transaction = await knex('transactions')
        .where('id', id)
        .andWhere('session_id', sessionID)
        .first()

        return { transaction }
    })
    
    // ACC details
    app.get('/sumary', {preHandler: [checkSessionIdExists]},async (req) => {

        const { sessionID } = req.cookies
        const sumary = await knex('transactions')
        .where('session_id', sessionID)
        .sum('amount')
        .first()

        return { sumary }
    })


}