import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, "supabase") {
  constructor(private configService: ConfigService) {
    const supabaseUrl = configService.get<string>("SUPABASE_URL");

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      audience: "authenticated",
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ["RS256"],
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
