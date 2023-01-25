import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<string | null, number | null> {
    transform(value: string | null, _: ArgumentMetadata): number | null {
        if (!value) {
            return null
        }

        return parseInt(value, 10)
    }
}
