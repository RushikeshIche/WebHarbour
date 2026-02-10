# WebHarbour - Admin & Moderator Guide

## Admin Dashboard Features (To Be Implemented)

This guide shows how to set up admin features and moderate product submissions.

## Current Status

The backend has full admin API endpoints ready. The frontend admin UI is being prepared.

## Manual Product Approval (For Now)

### Method 1: MongoDB Atlas Direct Edit

**1. Login to MongoDB Atlas**
- Go to https://cloud.mongodb.com
- Click your cluster
- Click "Collections"

**2. Find Products**
- Select `webharbour.products` collection
- Look for products with `status: "pending"`

**3. Approve Product**
- Click product document
- Edit the document
- Change `status` from `"pending"` to `"approved"`
- Click "Update"
- Product will now appear in marketplace

**4. Reject Product**
- Change `status` to `"rejected"`
- Add `rejectionReason`: "Reason for rejection"
- Click "Update"
- Notification to developer (future feature)

### Method 2: Using Postman/API Client

**1. Get Pending Products**
```
GET /api/admin/pending
Authorization: Bearer YOUR_TOKEN
```

Example response:
```json
[
  {
    "_id": "abc123",
    "title": "My App",
    "description": "...",
    "status": "pending",
    "developer": {
      "_id": "dev123",
      "username": "developer",
      "email": "dev@example.com"
    }
  }
]
```

**2. Approve Product**
```
POST /api/admin/products/:id/review
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "approved"
}
```

**3. Reject Product**
```
POST /api/admin/products/:id/review
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "status": "rejected",
  "rejectionReason": "Contains inappropriate content"
}
```

## Setting Up Moderators

### 1. Add Moderator Role

In MongoDB, update a user document:

```javascript
db.users.updateOne(
  { email: "moderator@example.com" },
  { $set: { isModerator: true } }
)
```

Or in MongoDB Atlas UI:
1. Go to Collections
2. Click users collection
3. Find user
4. Add field: `isModerator: true`
5. Update

### 2. Moderator Permissions

Moderators can:
- ✅ View pending products
- ✅ Approve/reject products
- ✅ Leave rejection reasons
- ❌ Delete products (future)
- ❌ Edit product details (future)
- ❌ Ban users (future)

## Review Criteria

Products should be reviewed based on:

### Quality Checks
- ✅ Title is clear and descriptive
- ✅ Description is detailed and accurate
- ✅ Category is appropriate
- ✅ Thumbnail image is clear
- ✅ File download works

### Content Guidelines
- ❌ No malware or viruses
- ❌ No copyrighted material
- ❌ No offensive/inappropriate content
- ❌ No misleading descriptions
- ❌ No spam or scams

### Technical Requirements
- ✅ Price is reasonable
- ✅ File size is reasonable (<5GB for free tier)
- ✅ File format is appropriate for category
- ✅ Thumbnail is proper format (JPG/PNG)

### Example Review Process

**Approve**: ✅
- Product title: "Photo Editor Pro"
- Description: Detailed features
- Category: Software
- Price: $4.99
- Thumbnail: Clear, professional image
- File: Actual working ZIP file

**Reject**: ❌
- Product title: "SUPER MEGA APP!!!"
- Description: Vague "you gotta see this"
- Category: Wrong category selected
- Price: Unreasonable ($999)
- Thumbnail: Blurry or inappropriate image
- File: Broken download link

---

## Future Admin Features

### Email Notifications
Implement to send emails to developers when:
- Product approved
- Product rejected (with reason)
- New review received
- Product purchased

### Dashboard Metrics
Show admins:
- Total products submitted
- Approval rate
- Average review time
- User activity
- Revenue metrics

### User Management
Admin can:
- View all users
- Ban users
- Reset passwords
- Edit user profiles
- View user activity

### Analytics
- Top products by downloads
- Top developers
- Revenue per product
- Category popularity
- User growth

### Automated Checks
- File size validation
- Image validation
- Malware scanning (integration)
- Spam detection (ML model)

---

## Security Considerations

### For Moderators
- [ ] Only trusted team members
- [ ] Unique login credentials
- [ ] Audit log of all actions
- [ ] Two-factor authentication (future)
- [ ] IP whitelisting (future)

### Data Protection
- [ ] Don't store sensitive files
- [ ] Scan uploads for malware
- [ ] Privacy policy clear
- [ ] GDPR compliant

### Handling Disputes
- Store rejection reasons
- Allow appeals (future)
- Keep audit trail
- Professional communication

---

## Automated Approval System (Future)

```javascript
// Pseudocode for automated checks

async function autoReviewProduct(product) {
  let score = 100;

  // File checks
  if (!isValidFileType(product.fileUrl)) score -= 50;
  if (product.fileSize > MAX_SIZE) score -= 30;

  // Content checks
  if (containsBadWords(product.title)) score -= 40;
  if (containsBadWords(product.description)) score -= 40;

  // Image checks
  if (!isValidImage(product.thumbnail)) score -= 25;

  // Price checks
  if (product.price > 999 || product.price < 0) score -= 20;

  // Auto approve if score > 85
  if (score > 85) {
    product.status = 'approved';
  } else if (score > 50) {
    product.status = 'pending'; // Needs manual review
  } else {
    product.status = 'rejected';
    product.rejectionReason = 'Failed automated validation';
  }

  return product;
}
```

---

## Common Rejection Reasons

Use these templates for consistency:

### Content Issues
- "Title contains spam/inappropriate content"
- "Description is misleading or incomplete"
- "Product violates copyright or intellectual property"
- "Contains offensive or adult content"

### Technical Issues
- "File download is broken or inaccessible"
- "File appears to contain malware"
- "Thumbnail image is broken or inappropriate"
- "File size exceeds limits"

### Quality Issues
- "Title is vague or unclear"
- "Description lacks sufficient detail"
- "Category selection is incorrect"
- "Price is unreasonably high"

### Pricing Issues
- "Price doesn't match market standards"
- "Free product should be marked as free"
- "Pricing tier is inappropriate for category"

---

## Managing Reviews & Ratings

### Review Moderation (Future Feature)
Reviews should be moderated to prevent:
- Spam reviews
- Fake ratings
- Offensive comments
- Competitor sabotage

### Flags to Watch
- Multiple reviews from same user in short time
- 1-star or 5-star only (no middle ratings)
- Repetitive review text
- Reviews with external links

---

## Reporting Issues

### Developer Reporting
Developers should be able to report:
- Fake reviews
- Unauthorized use
- Copyright violations
- Competing products

### User Reporting
Users should report:
- Malicious files
- Misleading descriptions
- Inappropriate content
- Non-functional products

---

## Best Practices

1. **Consistent Standards**: Apply same rules to all products
2. **Clear Communication**: Explain rejections professionally
3. **Timely Reviews**: Don't let products sit pending too long
4. **Appeals Process**: Allow developers to improve and resubmit
5. **Documentation**: Keep notes on why products approved/rejected
6. **Team Training**: Ensure all moderators follow same criteria

---

## Next Steps

1. ✅ Current: Manual approval via MongoDB
2. Soon: Admin UI dashboard
3. Soon: Email notifications
4. Future: Automated checks
5. Future: Appeal process
6. Future: Advanced analytics

For questions or suggestions, please contact the development team!
