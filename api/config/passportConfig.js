import jwtStrategy from 'passport-jwt/lib/strategy'
import extractJwt from 'passport-jwt/lib/extract_jwt'

const key = process.env.TWITCH_SHARED_SECRET;
const secret = Buffer.from(key, 'base64');

export let jwtAuthStrategy = new jwtStrategy({
    secretOrKey: secret,
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken()
}, async (token, done) => {
    try {
        return done(null, token.user);
    } catch (error) {
        return done(error);
    }
})