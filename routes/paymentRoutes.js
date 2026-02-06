import express from 'express';
import { savePaymentMethod, getSavedPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod, getPaymentHistory, getPaymentReceipt} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/save-method', protect, savePaymentMethod);
router.get('/saved-methods', protect, getSavedPaymentMethods);
router.delete('/saved-methods/:methodId', protect, deletePaymentMethod);
router.patch('/saved-methods/:methodId/set-default', protect, setDefaultPaymentMethod);
router.get('/history', protect, getPaymentHistory);
router.get('/receipt/:orderId', protect, getPaymentReceipt);

export default router;
