import MoodModel from "../models/mood";

export const add = (data: any) => {
  const doc = new MoodModel(data);
  return doc.save();
};

export const remove = (id: string) => {
  return MoodModel.findByIdAndDelete(id);
};

export const list = () => {
  return MoodModel.find().sort({ createdAt: -1 });
};
