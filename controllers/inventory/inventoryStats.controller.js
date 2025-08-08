const Delivery = require("../../models/Delivery");
const FinishedProduct = require("../../models/FinishedProduct");
const Invoice = require("../../models/Invoice");
const Package = require("../../models/Package");
const RawMaterial = require("../../models/RawMaterial");

class InventoryController {
  async inventoryStats(req, res) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based

      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);

      // Parallel fetch for counts
      const [
        totalRawMaterials,
        totalInvoices,
        totalPackages,
        totalDeliveries,
        totalFinishedProducts,
        monthlyStats,
      ] = await Promise.all([
        RawMaterial.countDocuments(),
        Invoice.countDocuments(),
        Package.countDocuments(),
        Delivery.countDocuments(),
        FinishedProduct.countDocuments(),
        Invoice.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfYear, $lt: endOfYear },
            },
          },
          {
            $lookup: {
              from: "salesorders", // Collection name
              localField: "order_id",
              foreignField: "orderId",
              as: "order",
            },
          },
          { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: { $month: "$createdAt" },
              revenue: { $sum: { $toDouble: "$order.total" } },
              orders: { $sum: 1 },
              orderPrice: { $sum: { $toDouble: "$order.orderPrice" } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // Graph data only till current month
      const graphData = monthNames
        .slice(0, currentMonth + 1)
        .map((name, index) => {
          const monthStat = monthlyStats.find((m) => m._id === index + 1);
          return {
            name,

            orders: monthStat ? monthStat.orders : 0,
            revenue: monthStat ? monthStat.orderPrice : 0,
          };
        });

      // Total revenue till date
      const totalRevenue = monthlyStats.reduce(
        (sum, m) => sum + m.revenue + m.orderPrice,
        0
      );

      res.json({
        success: true,
        data: {
          totalRawMaterials,
          totalInvoices,
          totalPackages,
          totalDeliveries,
          totalFinishedProducts,
          totalRevenue,
          graphData,
        },
      });
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new InventoryController();
