const mongoose = require('mongoose');

/* Schema for an item in the cart or in an order */
const itemSchema = {
  //Captures just the pizza attributes of the item
  pizza: {
    cheeseAmount: {
      type: String,
      required: true,
      enum: ['Regular', 'Extra', 'Light', 'None'],
    },
    comboName: {
      type: String,
      required: true,
      enum: [
        'Cheese',
        'Pepperoni',
        "Meat Lover's",
        'Supreme',
        "Pepperoni Lover's",
        'Super Supreme',
        "Veggie Lover's",
        "Ultimate Cheese Lover's",
        'Buffalo Chicken',
        'BBQ Chicken',
        'Hawaiian Chicken',
        'Chicken Bacon Parmesan',
      ],
    },
    crust: {
      type: String,
      required: true,
      enum: ['Hand Tossed', "Thin 'N Crispy", 'Original Pan'],
    },
    crustFlavor: {
      type: String,
      required: true,
      enum: ['No Crust Flavor', 'Garlic Buttery Blend', 'Toasted Parmesan'],
    },
    meats: [
      {
        _id: { type: mongoose.Schema.ObjectId, select: false },
        toppingName: {
          type: String,
          required: true,
          enum: [
            'Pepperoni',
            'Italian Sausage',
            'Ham',
            'Bacon',
            'Grilled Chicken',
            'Beef',
            'Pork',
          ],
        },
        amount: {
          type: String,
          required: true,
          enum: ['Extra Topping', 'Regular Topping'],
        },
        portion: {
          type: String,
          required: true,
          enum: ['Whole', 'Left Half', 'Right Half'],
        },
      },
    ],
    veggies: [
      {
        _id: { type: mongoose.Schema.ObjectId, select: false },
        toppingName: {
          type: String,
          required: true,
          enum: [
            'Mushrooms',
            'Roasted Spinach',
            'Red Onions',
            'Mediterranean Black Olives',
            'Green Bell Peppers',
            'Banana Peppers',
            'Pineapple',
            'Jalapeno Peppers',
            'Roma Tomatoes',
          ],
        },
        amount: {
          type: String,
          required: true,
          enum: ['Extra Topping', 'Regular Topping'],
        },
        portion: {
          type: String,
          required: true,
          enum: ['Whole', 'Left Half', 'Right Half'],
        },
      },
    ],
    priceType: {
      type: String,
      required: true,
      enum: ['Regular', 'Combo'],
    },
    sauce: {
      type: String,
      required: true,
      enum: [
        'Classic Marinara',
        'Creamy Garlic Parmesan',
        'Barbeque',
        'Buffalo',
      ],
    },
    sauceAmount: {
      type: String,
      required: true,
      enum: ['Regular', 'Extra', 'Light', 'None'],
    },
    size: {
      type: String,
      required: true,
      enum: ['Large', 'Medium', 'Personal'],
    },
  },
  //Number of this particular item in cart or order
  quantity: {
    type: Number,
    required: true,
  },
};

module.exports = itemSchema;
