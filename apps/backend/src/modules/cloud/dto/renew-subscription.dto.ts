import { IsInt, Max, Min } from 'class-validator';

export class RenewSubscriptionDto {
  @IsInt()
  @Min(1)
  @Max(36)
  additionalMonths: number;
}
