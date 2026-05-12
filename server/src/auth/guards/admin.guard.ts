import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { JwtPayload } from "../types/jwt-payload.type";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const role = request.user?.role;

    if (role !== "admin" && role !== "owner") {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
