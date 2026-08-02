exports.instructorApprovalConfirmation = (firstName, lastName) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Instructor Approval Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <a href="https://study-notion-hosting-rouge.vercel.app"><img class="logo" src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo"></a>
            <div class="message">Instructor Approval Confirmation</div>
            <div class="body">
                <p>Dear ${firstName} ${lastName},</p>
                <p>We are pleased to inform you that your application to become an instructor has been approved!</p>
                <p>You can now log in and start creating and managing your courses.</p>
                <p>Thank you for joining our platform. We look forward to your contributions!</p>
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us at <a href="mailto:info@studynotion.com">info@studynotion.com</a>. We are here to help!</div>
        </div>
    </body>
    
    </html>`;
  };
  
exports.instructorDenial = (firstName, lastName) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Instructor Application Denied</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <a href="https://study-notion-hosting-rouge.vercel.app"><img class="logo" src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo"></a>
            <div class="message">Instructor Application Denied</div>
            <div class="body">
                <p>Dear ${firstName} ${lastName},</p>
                <p>We regret to inform you that your application to become an instructor has been denied.</p>
                <p>If you believe this decision was made in error or if you have any questions regarding this decision, please contact us at <a href="mailto:info@studynotion.com">info@studynotion.com</a>.</p>
                <p>Thank you for your interest in our platform.</p>
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us at <a href="mailto:info@studynotion.com">info@studynotion.com</a>. We are here to help!</div>
        </div>
    </body>
    
    </html>`;
};

exports.userCreationConfirmation = (firstName, lastName, accountType) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Account Creation Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
    
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
    
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
    
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
    
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
    
            .highlight {
                font-weight: bold;
            }
        </style>
    
    </head>
    
    <body>
        <div class="container">
            <a href="https://study-notion-hosting-rouge.vercel.app"><img class="logo"
                    src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo"></a>
            <div class="message">Account Created Successfully</div>
            <div class="body">
                <p>Hi ${firstName} ${lastName},</p>
                <p>Your account has been successfully created. As an ${accountType}, your account is under review and will be activated once the admin approves it.</p>
                <p>If you have any questions, please feel free to reach out to us.</p>
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us
                at
                <a href="mailto:info@studynotion.com">info@studynotion.com</a>. We are here to help!
            </div>
        </div>
    </body>
    
    </html>`;
};

exports.instructorApproval = (firstName, lastName, email) => {
    return `<!DOCTYPE html>
      <html>
      
      <head>
          <meta charset="UTF-8">
          <title>Instructor Approval Request</title>
          <style>
              body {
                  background-color: #ffffff;
                  font-family: Arial, sans-serif;
                  font-size: 16px;
                  line-height: 1.4;
                  color: #333333;
                  margin: 0;
                  padding: 0;
              }
      
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  text-align: center;
              }
      
              .logo {
                  max-width: 200px;
                  margin-bottom: 20px;
              }
      
              .message {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 20px;
              }
      
              .body {
                  font-size: 16px;
                  margin-bottom: 20px;
              }
      
              .support {
                  font-size: 14px;
                  color: #999999;
                  margin-top: 20px;
              }
      
              .highlight {
                  font-weight: bold;
              }
          </style>
      
      </head>
      
      <body>
          <div class="container">
              <a href="https://study-notion-hosting-rouge.vercel.app"><img class="logo"
                      src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo"></a>
              <div class="message">New Instructor Approval Request</div>
              <div class="body">
                  <p>Dear Admin,</p>
                  <p>A new user, <span class="highlight">${firstName} ${lastName}</span>, has requested to join as an instructor.</p>
                  <p>Email: <span class="highlight">${email}</span></p>
                  <p>Please review and approve this request in the admin panel.</p>
              </div>
              <div class="support">If you have any questions or need further assistance, please feel free to reach out to us
                  at
                  <a href="mailto:info@studynotion.com">info@studynotion.com</a>. We are here to help!
              </div>
          </div>
      </body>
      
      </html>`;
};
