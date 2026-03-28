const getDashboardMetrics = async (req, res) => {
  try {

    const userId = getUserIdFromToken(req)

    const user = await prisma.user.findFirst({
      where: {
        id: userId
      }
    })

    if (!user) {
      res.status(400).json({ error: "User Not Found" })
    }

    const userRole = user.role;
    const managerAccountId = user.accountId;

    // Get current date and previous month date
    const currentDate = new Date();
    const previousMonthDate = new Date();
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);

    // Base where clause for payments
    const baseWhere = {
      paymentStatus: "COMPLETED",
      transTime: {
        gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      }
    };

    const previousMonthWhere = {
      paymentStatus: "COMPLETED",
      transTime: {
        gte: new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 1),
        lt: new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, 1)
      }
    };

    // For managers, we need to filter payments where billRefNumber matches their meters
    if (userRole === "manager") {
      // Get all meters for this manager
      const managerMeters = await getManagerMeters(managerAccountId);
      const meterNumbers = managerMeters.map(meter => meter.meterNumber);

      // Add billRefNumber filter for current month
      if (meterNumbers.length > 0) {
        baseWhere.billRefNumber = {
          in: meterNumbers
        };
        previousMonthWhere.billRefNumber = {
          in: meterNumbers
        };
      } else {
        // If manager has no meters, return empty results
        return res.json({
          totalPayments: { count: 0, percentageChange: "0" },
          totalRevenue: { amount: 0, percentageChange: "0" },
          averageAmount: { amount: 0, percentageChange: "0" },
          uniqueCustomers: { count: 0, percentageChange: "0" }
        });
      }
    }

    // Get COMPLETED payments for current month
    const currentMonthPayments = await prisma.payment.findMany({
      where: baseWhere
    });

    // Get COMPLETED payments for previous month
    const previousMonthPayments = await prisma.payment.findMany({
      where: previousMonthWhere
    });

    // Calculate total payments (count)
    const totalPayments = currentMonthPayments.length;
    const previousMonthTotalPayments = previousMonthPayments.length;
    const paymentsPercentageChange =
      previousMonthTotalPayments > 0
        ? ((totalPayments - previousMonthTotalPayments) /
          previousMonthTotalPayments) *
        100
        : totalPayments > 0 ? 100 : 0;

    // Calculate total revenue (sum of transAmount)
    const totalRevenue = currentMonthPayments.reduce(
      (sum, payment) => sum + payment.transAmount,
      0
    );
    const previousMonthTotalRevenue = previousMonthPayments.reduce(
      (sum, payment) => sum + payment.transAmount,
      0
    );
    const revenuePercentageChange =
      previousMonthTotalRevenue > 0
        ? ((totalRevenue - previousMonthTotalRevenue) /
          previousMonthTotalRevenue) *
        100
        : totalRevenue > 0 ? 100 : 0;

    // Calculate average amount
    const averageAmount =
      totalPayments > 0 ? totalRevenue / totalPayments : 0;
    const previousMonthAverageAmount =
      previousMonthTotalPayments > 0
        ? previousMonthTotalRevenue / previousMonthTotalPayments
        : 0;
    const averageAmountPercentageChange =
      previousMonthAverageAmount > 0
        ? ((averageAmount - previousMonthAverageAmount) /
          previousMonthAverageAmount) *
        100
        : averageAmount > 0 ? 100 : 0;

    // Get unique customers (count distinct msisdn)
    const uniqueCustomers = [
      ...new Set(currentMonthPayments.map((payment) => payment.msisdn))
    ].length;
    const previousMonthUniqueCustomers = [
      ...new Set(previousMonthPayments.map((payment) => payment.msisdn))
    ].length;
    const uniqueCustomersPercentageChange =
      previousMonthUniqueCustomers > 0
        ? ((uniqueCustomers - previousMonthUniqueCustomers) /
          previousMonthUniqueCustomers) *
        100
        : uniqueCustomers > 0 ? 100 : 0;

    res.json({
      totalPayments: {
        count: totalPayments,
        percentageChange: paymentsPercentageChange.toFixed(0)
      },
      totalRevenue: {
        amount: totalRevenue,
        percentageChange: revenuePercentageChange.toFixed(0)
      },
      averageAmount: {
        amount: Math.round(averageAmount),
        percentageChange: averageAmountPercentageChange.toFixed(0)
      },
      uniqueCustomers: {
        count: uniqueCustomers,
        percentageChange: uniqueCustomersPercentageChange.toFixed(0)
      },
      totalUnits: currentMonthPayments.reduce(
        (sum, payment) => sum + parseFloat(payment.units || 0),
        0
      ),
      serviceFee: currentMonthPayments.reduce((sum, payment) => {
        const units = parseFloat(payment.units || 0);
        const paymentAmount = parseFloat(payment.transAmount || 0);
        const serviceFee = paymentAmount - (units * 28);
        return sum + serviceFee;
      }, 0)
    });
  } catch (error) {
    console.log("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
};
