import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no auth header, allow but don't set user
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      request.user = null;
      return true;
    }

    const token = authHeader.substring(7);

    try {
      const user = await this.authService.validateUser(token);
      request.user = user;
    } catch (error) {
      // Invalid token, but still allow access as anonymous
      request.user = null;
    }

    return true;
  }
}
