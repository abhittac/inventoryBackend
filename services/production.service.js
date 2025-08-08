const Production = require("../models/Production");
const { BAG_TYPES, OPERATOR_TYPES } = require("../config/constants");
const logger = require("../utils/logger");
const Flexo = require("../models/Flexo");
const SalesOrder = require("../models/SalesOrder");
const WcutBagmaking = require("../models/WcutBagmaking");
const DcutBagmaking = require("../models/DcutBagmaking");
const Opsert = require("../models/Opsert");

class ProductionService {
  async getProduction({
    bagType,
    operatorType,
    status,
    date,
    page = 1,
    limit = 10,
  }) {
    try {
      // Log request parameters for debugging
      console.log("Query Parameters:", { bagType, status, date });
      const query = {};
      if (bagType) query.bagType = bagType;
      if (operatorType) query.operatorType = operatorType;
      if (status && status !== "all") query.status = status;
      if (date) {
        const formattedDate = new Date(date);
        console.log("Formatted Date:", formattedDate);
        query.productionDate = formattedDate;
      }
      const skip = (page - 1) * limit;
      console.log("Pagination Skip:", skip, "Limit:", limit);

      const productions = await Production.find(query).skip(skip).limit(limit);
      const total = await Production.countDocuments(query);

      return {
        data: productions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
        },
      };
    } catch (error) {
      logger.error("Error fetching production data:", error);
      throw error;
    }
  }

  async getFlexoPrinting({ status, date }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;
      if (date) {
        const formattedDate = new Date(date);
        match.productionDate = formattedDate;
      }

      const flexoDocuments = await Flexo.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "salesorders", // Ensure this matches the actual collection name
            let: { flexoOrderId: "$order_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$orderId", "$$flexoOrderId"] } } },
            ],
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: flexoDocuments };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getBagMaking({ status, operator_name }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const flexoDocuments = await WcutBagmaking.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "salesorders", // Ensure this matches the actual collection name
            let: { flexoOrderId: "$order_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$orderId", "$$flexoOrderId"] } } },
            ],
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        { $sort: { updatedAt: -1 } },
      ]);

      return { data: flexoDocuments };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getOpsertPrinting({ status }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const flexoDocuments = await Opsert.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "salesorders", // Ensure this matches the actual collection name
            let: { flexoOrderId: "$order_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$orderId", "$$flexoOrderId"] } } },
            ],
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: flexoDocuments };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getDcutBagMaking({ status }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const flexoDocuments = await DcutBagmaking.aggregate([
        { $match: match },
        {
          $lookup: {
            from: "salesorders", // Ensure this matches the actual collection name
            let: { flexoOrderId: "$order_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$orderId", "$$flexoOrderId"] } } },
            ],
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        { $sort: { updatedAt: -1 } },
      ]);

      return { data: flexoDocuments };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  // production counter

  async getFlexoCounter({ status, date }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;
      if (date) {
        const formattedDate = new Date(date);
        match.productionDate = formattedDate;
      }

      const flexoDocuments = await Flexo.aggregate([
        { $match: match },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: flexoDocuments };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getWCutBagMakingCounter({ status, operator_name }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const WcutBagmakingCounter = await WcutBagmaking.aggregate([
        { $match: match },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: WcutBagmakingCounter };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getDCutOpsertCounter({ status }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const opsertCounter = await Opsert.aggregate([
        { $match: match },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: opsertCounter };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }

  async getDCutBagMakingCounter({ status }) {
    try {
      const match = {};
      if (status && status !== "all") match.status = status;

      const dcutRecord = await DcutBagmaking.aggregate([
        { $match: match },
        { $sort: { productionDate: -1 } },
      ]);

      return { data: dcutRecord };
    } catch (error) {
      console.error("Error fetching Flexo Printing production:", error);
      throw error;
    }
  }
}

module.exports = new ProductionService();
