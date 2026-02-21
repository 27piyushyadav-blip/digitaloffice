import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { FastifyRequest } from "fastify";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
    });
  }

  // 1. Set 'req' to 'any' here to satisfy the Express-biased base class
  validate(req: any, payload: any) {
    // 2. Cast it back to FastifyRequest inside the function
    const request = req as FastifyRequest;

    // 3. Now it is safe and correctly typed
    const authHeader = request.headers.authorization;

    if (!authHeader) return null;

    const refreshToken = authHeader.replace(/Bearer/i, "").trim();

    return {
      ...payload,
      refreshToken,
    };
  }
}
