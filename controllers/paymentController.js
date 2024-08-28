const stripe = require('stripe')('sk_test_51PiscID9LY3tfPKrspaiTJpv8UOg7HNbIgu2KCbljYZfsebJHfSqPMT88im01KTsyRUx80SbxSywOBUpZXIfMm5h0034JuNLIW');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');

const YOUR_DOMAIN = 'http://localhost:3000';

exports.createCheckoutSession = async (req, res) => {
    try {
        const reservationId = req.params.id;
        const reservation = await Reservation.findById(reservationId);
        const vehicle = await Vehicle.findById(reservation.vehicle);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['alipay','amazon_pay','card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Reservation for ${vehicle.make} ${vehicle.model}`, 
                        },
                        unit_amount: reservation.totalCost * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/payment/success`,
            cancel_url: `${YOUR_DOMAIN}/payment/cancel`,
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
