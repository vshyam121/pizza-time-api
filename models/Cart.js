const mongoose = require('mongoose');
const hash = require('object-hash');

const CartSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'Please associate a user id with a cart'],
    unique: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  items: [
    {
      hash: {
        type: String,
        required: true,
      },
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
            name: {
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
              enum: ['Extra', 'Regular'],
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
            name: {
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
              enum: ['Extra', 'Regular'],
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
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
});

CartSchema.post('save', function () {
  let cartQuantity = 0;
  this.items = this.items.map((item) => {
    cartQuantity += item.quantity;
    return { ...item, hash: [hash(item.pizza)] };
  });

  this.quantity = cartQuantity;
});

module.exports = mongoose.model('Cart', CartSchema);
