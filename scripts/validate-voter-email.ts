import { prisma } from '../src/lib/db'
import { sendOTP } from '../src/lib/email'
import * as fs from 'fs'

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile('.env.local')

async function validateVoterEmail(voterId: string) {
  try {
    console.log(`\n🔍 Validating email for voter: ${voterId}\n`)
    console.log('='.repeat(80))
    
    // Step 1: Check database
    console.log('\n📋 Step 1: Checking Database...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const voter = await prisma.voter.findFirst({
      where: {
        OR: [
          { voterId: voterId },
          { name: { contains: voterId, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true
      }
    })
    
    if (!voter) {
      console.log(`❌ Voter not found: ${voterId}`)
      await prisma.$disconnect()
      return
    }
    
    console.log(`✅ Voter found: ${voter.name}`)
    console.log(`   Voter ID: ${voter.voterId}`)
    console.log(`   Voter Email: ${voter.email || 'N/A'}`)
    console.log(`   User Email: ${voter.user?.email || 'N/A'}`)
    
    // Check if emails match
    if (voter.email && voter.user?.email) {
      if (voter.email === voter.user.email) {
        console.log(`   ✅ Emails match in both tables`)
      } else {
        console.log(`   ⚠️  WARNING: Emails don't match between Voter and User tables!`)
      }
    }
    
    if (!voter.email) {
      console.log(`   ❌ No email found in voter record`)
      await prisma.$disconnect()
      return
    }
    
    // Step 2: Test email sending
    console.log('\n📧 Step 2: Testing Email Delivery...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Sending test OTP to: ${voter.email}`)
    console.log(`   Recipient Name: ${voter.name}`)
    
    // Generate a test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString()
    
    try {
      const emailResult = await sendOTP(voter.email, testOTP, {
        recipientName: voter.name,
        subject: 'Test OTP - Email Validation - KMS Election',
        expiryMinutes: 10
      })
      
      if (emailResult.success) {
        console.log(`   ✅ Email sent successfully!`)
        console.log(`   Message ID: ${emailResult.messageId || 'N/A'}`)
        console.log(`   📬 Please check the inbox (and spam folder) for: ${voter.email}`)
        console.log(`   🔑 Test OTP Code: ${testOTP}`)
        console.log(`   ⏰ This OTP is valid for 10 minutes`)
      } else {
        console.log(`   ❌ Email sending failed: ${emailResult.message}`)
      }
    } catch (emailError: any) {
      console.log(`   ❌ Error sending email: ${emailError.message}`)
      if (emailError.code) {
        console.log(`   Error Code: ${emailError.code}`)
      }
    }
    
    // Step 3: Summary
    console.log('\n📊 Step 3: Validation Summary')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Voter: ${voter.name}`)
    console.log(`   Email: ${voter.email}`)
    console.log(`   Status: ${voter.isActive ? 'Active' : 'Inactive'}`)
    console.log(`   Has Voted: ${voter.hasVoted ? 'Yes' : 'No'}`)
    console.log(`   Last Login: ${voter.lastLoginAt ? voter.lastLoginAt.toLocaleString() : 'Never'}`)
    
    console.log('\n✅ Validation Steps Completed!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Check the email inbox (and spam folder) for the test OTP')
    console.log('   2. Verify the email was received successfully')
    console.log('   3. Test the login flow using the email address')
    console.log('   4. If email is not received, check:')
    console.log('      - Email address is correct')
    console.log('      - Spam/junk folder')
    console.log('      - Gmail SMTP configuration')
    console.log('      - Firewall/network restrictions')
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ Error during validation:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const voterId = process.argv[2] || 'VID-1872'

validateVoterEmail(voterId)
  .then(() => {
    console.log('\n✅ Validation completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

