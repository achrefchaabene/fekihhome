import Order from "../models/Order.js";
import Product from "../models/Product.js";

function buildPeriodKey(date, period) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return period === "year" ? String(year) : `${year}-${month}`;
}

export async function createOrder(request, response, next) {
  try {
    const { customer, items } = request.body;

    if (!Array.isArray(items) || items.length === 0) {
      return response.status(400).json({ message: "Le panier est vide." });
    }

    const ids = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: ids } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const orderItems = [];
    let totalAmount = 0;
    let totalCost = 0;

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!product || quantity < 1) {
        return response.status(400).json({ message: "Article invalide dans le panier." });
      }

      if (product.stock < quantity) {
        return response.status(400).json({ message: `Stock insuffisant pour ${product.name}.` });
      }

      const unitPrice = product.promotion?.enabled && product.promotion.price > 0 ? product.promotion.price : product.sellingPrice;
      const lineTotal = unitPrice * quantity;
      const lineCost = product.purchasePrice * quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: unitPrice,
        lineTotal,
        lineProfit: lineTotal - lineCost
      });

      totalAmount += lineTotal;
      totalCost += lineCost;
    }

    const order = await Order.create({
      customer,
      items: orderItems,
      totalAmount,
      totalCost,
      profit: totalAmount - totalCost
    });

    response.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

export async function listOrders(_request, response, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    response.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(request, response, next) {
  try {
    const { status } = request.body;

    if (!["accepted", "refused", "pending"].includes(status)) {
      return response.status(400).json({ message: "Statut commande invalide." });
    }

    const order = await Order.findById(request.params.id);

    if (!order) {
      return response.status(404).json({ message: "Commande introuvable." });
    }

    if (status === "accepted" && order.status !== "accepted") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product || product.stock < item.quantity) {
          return response.status(400).json({ message: `Stock insuffisant pour ${item.name}.` });
        }
      }

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }

    if (status !== "accepted" && order.status === "accepted") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.status = status;
    await order.save();
    response.json(order);
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(request, response, next) {
  try {
    const order = await Order.findByIdAndDelete(request.params.id);

    if (!order) {
      return response.status(404).json({ message: "Commande introuvable." });
    }

    response.json({ message: "Commande supprimee." });
  } catch (error) {
    next(error);
  }
}

export async function getOrderStats(request, response, next) {
  try {
    const period = request.query.period === "year" ? "year" : "month";
    const orders = await Order.find({ status: "accepted" }).sort({ createdAt: 1 });
    const statsMap = new Map();

    for (const order of orders) {
      const key = buildPeriodKey(order.createdAt, period);
      const current = statsMap.get(key) || {
        period: key,
        orders: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        items: 0
      };

      current.orders += 1;
      current.revenue += order.totalAmount;
      current.cost += order.totalCost;
      current.profit += order.profit;
      current.items += order.items.reduce((sum, item) => sum + item.quantity, 0);
      statsMap.set(key, current);
    }

    const stats = Array.from(statsMap.values()).reverse();
    const totals = stats.reduce(
      (acc, row) => ({
        orders: acc.orders + row.orders,
        revenue: acc.revenue + row.revenue,
        cost: acc.cost + row.cost,
        profit: acc.profit + row.profit,
        items: acc.items + row.items
      }),
      { orders: 0, revenue: 0, cost: 0, profit: 0, items: 0 }
    );

    response.json({ period, totals, stats });
  } catch (error) {
    next(error);
  }
}
