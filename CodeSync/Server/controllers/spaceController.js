const Space = require("../models/spaceSchema");

const isOwner = (space, userId) =>
  space.owner.toString() === userId.toString();

/*
 * @desc GET spaces
 * @route GET /api/spaces
 * @access Private
 * */
const getSpaces = async (req, res) => {
  const spaces = await Space.find({ owner: req.user._id }).select(
    "spaceId spaceName createdAt"
  );
  res.status(200).send(spaces);
};

/*
 * Create spaces
 * @route POST /api/spaces
 * @access Private
 * */
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

/*
 * @desc Get data of a particular space
 * @route GET /api/spaces/:id
 * @access Public
 * */
const getSpaceData = async (req, res) => {
  try {
    const space = await Space.findOne({
      spaceId: req.params.id,
    }).select("-_id -__v -updatedAt -createdAt");
    if (!space) {
      throw new Error("No space found with this spaceId!");
    }

    res.status(200).send(space);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

/*
 * @desc Update spaces (rename or save code)
 * @route PUT /api/spaces/:id
 * @access Private (owner only)
 * */
const updateSpaces = async (req, res) => {
  try {
    const space = await Space.findOne({ spaceId: req.params.id });
    if (!space) {
      throw new Error("No space found with this spaceId!");
    }

    if (!isOwner(space, req.user._id)) {
      return res.status(403).send({ error: "Not authorized to update this space" });
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

/*
 * @desc Delete spaces
 * @route DELETE /api/spaces/:id
 * @access Private
 * */
const deleteSpaces = async (req, res) => {
  try {
    const space = await Space.findOne({
      owner: req.user._id,
      spaceId: req.params.id,
    });
    if (!space) {
      throw new Error("No space found with this spaceId!");
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
