import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {

    beforeAll(async () => await app.ready())
    afterAll(async () => await app.close())
    beforeEach(async () => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })
    
    

    it('should be able to create a transaction', async () => {
    
        await request(app.server)
        .post('/transactions')
        .send({
            title: 'New Transaction',
            amount: 500,
            type: 'credit'
        })
        .expect(201)
    
    })

    it('should be able to list all transactions', async () => {
        
        const createResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'New Transaction',
            amount: 500,
            type: 'credit'
        })
        
        const cookies = createResponse.get('Set-Cookie')

        const listResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

        expect(listResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New Transaction',
                amount: 500
            })
        ])
    })

    it('should be able to get a specific transaction', async () => {
        
        const createResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'New Transaction',
            amount: 500,
            type: 'credit'
        })
        
        const cookies = createResponse.get('Set-Cookie')

        const listResponse = await request(app.server)
        .get('/transactions')
        .set('Cookie', cookies)
        .expect(200)

        const transactionId = listResponse.body.transactions[0].id

        const getResponse = await request(app.server)
        .get(`/transactions/${transactionId}`)
        .set('Cookie', cookies)
        .expect(200)

        expect(getResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New Transaction',
                amount: 500
            })
        )
    })

    it('should be able to get the sumary', async () => {
        
        const createResponse = await request(app.server)
        .post('/transactions')
        .send({
            title: 'Credit Transaction',
            amount: 500,
            type: 'credit'
        })
        
        const cookies = createResponse.get('Set-Cookie')

        await request(app.server)
        .post('/transactions')
        .set('Cookie', cookies)
        .send({
            title: 'Debit Transaction',
            amount: 200,
            type: 'debit'
        })

        const sumaryResponse = await request(app.server)
        .get('/transactions/sumary')
        .set('Cookie', cookies)
        .expect(200)

        expect(sumaryResponse.body.sumary).toEqual({
            'sum(`amount`)': 300
        })
    })
    
    
})

