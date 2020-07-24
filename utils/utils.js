const hash = require('object-hash');

/* Generate pizza to item id hashmap to take care of duplicate pizzas */
exports.generatePizzaHashMap = (items) => {
  let pizzaHashMap = {};
  items.forEach((item, index) => {
    pizzaHashMap[hash(item.pizza)] = index;
  });

  return pizzaHashMap;
};
