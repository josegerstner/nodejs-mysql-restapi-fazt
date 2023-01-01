import { pool } from '../db.js'

export const ping = async (req, res)=> {
    const [result] = await pool.query('SELECT "pong" as result') // con el [result] estoy obteniendo sólo result de toda la respuesta, sino me trae un montón de info que no necesito
    res.json(result[0])
}