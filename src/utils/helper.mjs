export const getMonth = date => {
  const newdate = new Date(date);
  const month = new Date(
    Date.UTC(newdate.getUTCFullYear(), newdate.getUTCMonth(), 1),
  );
  return month;
};

export const getToday = date => {
  const newdate = new Date(date);
  const today = new Date(
    Date.UTC(
      newdate.getUTCFullYear(),
      newdate.getUTCMonth(),
      newdate.getUTCDate(),
    ),
  );
  return today;
};

export const getCategoryWiseTotal = data => {
  const categoryWiseTotal = [];
  for (const item of data) {
    const itemTotal = Number(item.price) * Number(item.quantity);
    const index = categoryWiseTotal.findIndex(
      category => category.category === item.category,
    );
    if (index === -1) {
      categoryWiseTotal.push({
        category: item.category,
        total: itemTotal,
      });
    } else {
      categoryWiseTotal[index].total += itemTotal;
    }
  }
  return categoryWiseTotal;
};
