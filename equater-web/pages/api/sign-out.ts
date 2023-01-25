import { withIronSessionApiRoute } from 'iron-session/next'
import { sessionOptions } from '../../constants/environment'

export default withIronSessionApiRoute(async (req, res) => {
    await req.session.destroy()
    res.status(200)
    res.end()
}, sessionOptions)
