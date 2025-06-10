const FabricQuality = require('../../models/FabricQuality');
const BagColor = require('../../models/BagColor');
const GSM = require('../../models/Gsm');
const Size = require('../../models/Size');
const HandleColor = require('../../models/HandleColor');

const RollSize = require('../../models/RollSize');

const modelMap = {
    fabricQuality: FabricQuality,
    bagColor: BagColor,
    gsm: GSM,
    size: Size,
    handleColor: HandleColor,
    rollSize: RollSize,
};

// CREATE
exports.create = async (req, res) => {
    try {
        const { type } = req.params;
        const Model = modelMap[type];
        if (!Model) return res.status(400).json({ message: 'Invalid type' });

        const { name, status } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Name is required and must be a string' });
        }

        const trimmedName = name.trim().toLowerCase();

        // Check if name already exists
        const existing = await Model.findOne({ name: trimmedName });
        if (existing) {
            return res.status(409).json({ message: `${type} already exists` });
        }

        const item = new Model({ name: trimmedName, status });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// GET ALL
exports.getAll = async (req, res) => {
    try {

        const { type } = req.params;
        const Model = modelMap[type];
        console.log('model', Model);
        if (!Model) return res.status(400).json({ message: 'Invalid type' });

        const items = await Model.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET BY ID
exports.getById = async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = modelMap[type];

        if (!Model) return res.status(400).json({ message: 'Invalid type' });

        const item = await Model.findById(id);
        if (!item) return res.status(404).json({ message: `${type} not found` });

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE
exports.update = async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = modelMap[type];

        if (!Model) return res.status(400).json({ message: 'Invalid type' });

        const { name, status } = req.body;

        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Name must be a string' });
        }

        const updateData = {};
        if (name) updateData.name = name.trim().toLowerCase();
        if (status) updateData.status = status;

        // Optional: Check if new name conflicts with existing entry (unique)
        if (updateData.name) {
            const existing = await Model.findOne({ name: updateData.name, _id: { $ne: id } });
            if (existing) {
                return res.status(409).json({ message: `${type} name already exists` });
            }
        }

        const updatedItem = await Model.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedItem) return res.status(404).json({ message: `${type} not found` });

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// DELETE
exports.delete = async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = modelMap[type];

        if (!Model) return res.status(400).json({ message: 'Invalid type' });

        const deleted = await Model.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: `${type} not found` });

        res.json({ message: `${type} deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllAttributes = async (req, res) => {
    try {
        const [bagColors, fabricQualities, gsms, handleColors, sizes, rollSizes] = await Promise.all([
            BagColor.find({ status: 'active' }),
            FabricQuality.find({ status: 'active' }),
            GSM.find({ status: 'active' }),
            HandleColor.find({ status: 'active' }),
            Size.find({ status: 'active' }),
            RollSize.find({ status: 'active' }),
        ]);

        const data = {
            'bag-color': bagColors.map(item => item.name),
            'fabric-quality': fabricQualities.map(item => item.name),
            gsm: gsms.map(item => item.name),
            size: sizes.map(item => item.name),
            'handle-color': handleColors.map(item => item.name),
            'roll-size': rollSizes.map(item => item.name),
        };

        res.json(data);
    } catch (error) {
        console.error('Error fetching attributes:', error);
        res.status(500).json({ error: 'Failed to fetch attributes' });
    }
};
