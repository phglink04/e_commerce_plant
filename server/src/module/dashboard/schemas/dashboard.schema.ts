import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class DashboardStat extends Document {
  @Prop({ type: String, required: true })
  metric: string = "";

  @Prop({ type: Number, default: 0 })
  value: number = 0;

  @Prop({ type: Date })
  recordedAt?: Date;

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date = new Date();

  @Prop({ type: Date, default: () => new Date() })
  updatedAt: Date = new Date();
}

export const DashboardStatSchema = SchemaFactory.createForClass(DashboardStat);
