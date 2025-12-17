# **SMSINDIAHUB SMS Integration Setup**

## **✅ What's Been Done**

SMSINDIAHUB has been integrated as the **primary SMS provider** for OTP delivery. Twilio configuration is kept but inactive.

**Created:**
- ✅ SMSINDIAHUB provider (`src/lib/sms-indiahub.ts`)
- ✅ Updated OTP sending to use SMSINDIAHUB only
- ✅ Twilio kept inactive (configuration preserved for future use)

---

## **📋 Configuration**

### **Step 1: Add Environment Variables**

Add these to your `.env.local` file:

```env
# SMSINDIAHUB SMS Configuration (Primary)
SMSINDIAHUB_API_KEY="syf6iK5sWkC2OaW5jnQPDw"
SMSINDIAHUB_SENDER_ID="SMSHUB"
SMSINDIAHUB_GATEWAY_ID="2"
SMSINDIAHUB_FLASH_MESSAGE="0"
SMSINDIAHUB_DELIVERY_CALLBACK="0"
```

### **Step 2: Restart Server**

After adding environment variables, restart your development server:

```bash
npm run dev
```

---

## **🔧 How It Works**

### **SMS Sending Flow:**

1. **User requests OTP** via email or phone
2. **System sends via SMSINDIAHUB** (only active provider)
3. **If SMSINDIAHUB fails**, returns error to user

### **API Endpoint:**

**SMSINDIAHUB API:**
```
GET https://cloud.smsindiahub.in/vendorsms/pushsms.aspx
```

**Parameters:**
- `APIKey` - Your API key
- `msisdn` - Phone number (format: 91XXXXXXXXXX)
- `sid` - Sender ID
- `msg` - Message content
- `fl` - Flash message (0 = no, 1 = yes)
- `dc` - Delivery callback (0 = no, 1 = yes)
- `gwid` - Gateway ID (default: 2)

---

## **📁 Files Created/Modified**

### **New Files:**
- `src/lib/sms-indiahub.ts` - SMSINDIAHUB SMS provider

### **Modified Files:**
- `src/app/api/voter/send-otp/route.ts` - Updated to use SMSINDIAHUB only
- `env.example` - Added SMSINDIAHUB configuration

---

## **🧪 Testing**

### **Test SMS Sending:**

1. Request OTP through your app
2. Check server logs for:
   ```
   📱 SMSINDIAHUB SMS BEING SENT:
      Phone: 91XXXXXXXXXX
      Message: Your KMS Election OTP is: XXXXXX...
      Sender ID: SMSHUB
   ```
3. Check phone for SMS delivery
4. If SMSINDIAHUB fails, check for Twilio fallback logs

---

## **⚙️ Configuration Options**

### **Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMSINDIAHUB_API_KEY` | Your SMSINDIAHUB API key | - | ✅ Yes |
| `SMSINDIAHUB_SENDER_ID` | Sender ID for SMS | `SMSHUB` | ❌ No |
| `SMSINDIAHUB_GATEWAY_ID` | Gateway ID | `2` | ❌ No |
| `SMSINDIAHUB_FLASH_MESSAGE` | Flash message flag | `0` | ❌ No |
| `SMSINDIAHUB_DELIVERY_CALLBACK` | Delivery callback flag | `0` | ❌ No |

### **Phone Number Format:**

- **10 digits**: Automatically adds `91` country code
- **11 digits starting with 0**: Removes `0` and adds `91`
- **Already formatted**: Uses as-is

**Examples:**
- `7875123456` → `917875123456`
- `07875123456` → `917875123456`
- `917875123456` → `917875123456`

---

## **🐛 Troubleshooting**

### **SMS Not Sending:**

1. **Check API Key**: Verify `SMSINDIAHUB_API_KEY` is correct
2. **Check Phone Format**: Ensure phone number is in correct format
3. **Check Server Logs**: Look for error messages
4. **Check SMSINDIAHUB Dashboard**: Verify account status and balance

### **SMSINDIAHUB Fails:**

- Check SMSINDIAHUB account status
- Verify API key is valid
- Check SMSINDIAHUB logs/dashboard
- Check network connectivity
- Verify phone number format
- Check server logs for detailed errors
- Contact SMSINDIAHUB support if needed

---

## **📝 API Response Format**

SMSINDIAHUB typically returns XML or JSON. The integration handles both formats:

**Success Response:**
```json
{
  "status": "success",
  "message": "SMS sent successfully"
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "Error message"
}
```

---

## **✅ Current Status**

- ✅ SMSINDIAHUB integration complete
- ✅ Active SMS provider: SMSINDIAHUB (only provider)
- ✅ Twilio configuration kept but inactive
- ✅ Phone number formatting handled
- ✅ Error handling implemented

**Your system now uses SMSINDIAHUB as the only active SMS provider!** 🎉

---

## **🔄 SMS Provider Status**

1. **SMSINDIAHUB** (Active) → Only active SMS provider
2. **Twilio** (Inactive) → Configuration preserved for future use
3. **Error** → Returns error if SMSINDIAHUB fails

SMSINDIAHUB is the sole active SMS provider!

