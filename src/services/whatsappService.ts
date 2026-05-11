import axios from 'axios';
import axiosRetry from 'axios-retry';
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    const status = error.response?.status ?? 0;
    return axiosRetry.isNetworkError(error) || status >= 500;
  },
});
export const sendWhatsappOtp = async (phone: string, otp: number) => {
  try {
    const url = `https://graph.facebook.com/v24.0/${process.env.WHATSAPP_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: `91${phone}`,
      type: 'template',
      template: {
        name: 'otp_message',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(otp),
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              {
                type: 'text',
                text: otp,
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
};
