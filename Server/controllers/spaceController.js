const Space = require("../models/spaceSchema");
const interviewRoomService = require("../services/interviewRoomService");

const isOwner = (space, userId) =>
  space.owner.toString() === userId.toString();

const getSpaces = async (req, res) => {
  const spaces = await Space.find({ owner: req.user._id }).select(
    "spaceId spaceName createdAt"
  );
  res.status(200).send(spaces);
};

const createSpaces = async (req, res) => {
  try {
    if (!req.body.spaceId || !req.body.spaceName) {
      throw new Error("One or more fields missing");
    }

    const spaceData = [
      {
        fileName: "Untitled-1",
        fileData: "",
        fileLang: "javascript",
      },
    ];

    const space = new Space({
      spaceId: req.body.spaceId,
      spaceName: req.body.spaceName,
      owner: req.user._id,
      spaceData,
    });

    await space.save();

    const spaces = await Space.find({ owner: req.user._id }).select(
      "spaceId spaceName createdAt"
    );

    res.status(200).send(spaces);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getSpaceData = async (req, res) => {
  try {
    let space = await Space.findOne({
      spaceId: req.params.id,
    }).select("-_id -__v -updatedAt -createdAt");

    if (!space) {
      const interview = await interviewRoomService.getInterviewBySpaceId(
        req.params.id
      );
      if (interview) {
        await interviewRoomService.ensureSpaceForInterview(interview);
        space = await Space.findOne({
          spaceId: req.params.id,
        }).select("-_id -__v -updatedAt -createdAt");
      }
    }

    if (!space) {
      throw new Error("No space found with this spaceId!");
    }

    res.status(200).send(space);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const updateSpaces = async (req, res) => {
  try {
    const space = await Space.findOne({ spaceId: req.params.id });
    if (!space) {
      throw new Error("No space found with this spaceId!");
    }

    if (!isOwner(space, req.user._id)) {
      return res
        .status(403)
        .send({ error: "Not authorized to update this space" });
    }

    if (req.body.field === "name") {
      if (!req.body.name?.trim()) {
        throw new Error("Space name is required");
      }

      space.spaceName = req.body.name.trim();
      await space.save();

      const spaces = await Space.find({ owner: req.user._id }).select(
        "spaceId spaceName createdAt"
      );

      return res.status(201).send(spaces);
    }

    if (req.body.spaceData) {
      space.spaceData = req.body.spaceData;
      await space.save();
      return res.status(201).json("Saved!");
    }

    throw new Error("Invalid update payload");
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteSpaces = async (req, res) => {
  try {
    const space = await Space.findOne({ spaceId: req.params.id });
    if (!space) {
      return res
        .status(404)
        .send({ error: "No space found with this spaceId!" });
    }

    if (!isOwner(space, req.user._id)) {
      return res
        .status(403)
        .send({ error: "Only the owner can delete this space" });
    }

    await space.deleteOne();

    const spaces = await Space.find({ owner: req.user._id }).select(
      "spaceId spaceName createdAt"
    );
    res.status(201).send(spaces);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = {
  getSpaces,
  createSpaces,
  updateSpaces,
  deleteSpaces,
  getSpaceData,
};
