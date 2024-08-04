import { createParamDecorator, ExecutionContext, HttpException } from "@nestjs/common";

export const Auth = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new HttpException('Unauthorized', 401);
        }

        return user;
    }
);