import { Module, Global } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthGuard } from "./guards/auth.guard";
import { OptionalAuthGuard } from "./guards/optional-auth.guard";

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OptionalAuthGuard],
  exports: [AuthService, AuthGuard, OptionalAuthGuard],
})
export class AuthModule {}
