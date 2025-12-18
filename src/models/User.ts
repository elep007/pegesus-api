import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  telegramId: string;
  registerDate: Date;
  expireDate: Date;
  status: 'active' | 'expired';
  statusForced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    registerDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expireDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    statusForced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Update status based on expireDate before save
UserSchema.pre('save', function (this: IUser) {
  if (!this.statusForced) {
    this.status = this.expireDate < new Date() ? 'expired' : 'active';
  }
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

