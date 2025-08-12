import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  selectedTemplates: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    selectedTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSequenceTemplate' }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
