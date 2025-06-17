<p align="center">
    <a href="https://YouTube.com/@RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/Logo.png" width="150">
    </a>
</p>

<div align="center">
    <p>
        Follow me on social media:
    </p>
    <!-- URL de descarga de íconos tamaño 48px X 48px https://iconos8.es/icons/set/social-media -->
    <a style="text-decoration: none;" href="https://www.facebook.com/RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/Facebook.png" alt="Facebook" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://www.instagram.com/RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/Instagram.png" alt="Instagram" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://www.youtube.com/@RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/YouTube.png" alt="YouTube" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://www.x.com/RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/X.png" alt="X (Twitter)" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://www.linkedin.com/company/andyrubiano" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/LinkedIn.png" alt="LinkedIn" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://www.tiktok.com/@RubianoAndy" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/TikTok.png" alt="TikTok" style="width: 30px; height: auto;">
    </a>
    <a style="text-decoration: none;" href="https://wa.me/573178737226" target="_blank">
        <img src="https://raw.githubusercontent.com/RubianoAndy/App_images/main/WhatsApp.png" alt="WhatsApp" style="width: 30px; height: auto;">
    </a>
</div>

<p align="center">
    &copy; 2024 <a href="https://YouTube.com/@RubianoAndy" target="_blank" class="hover:underline">Andy Rubiano™ - International company</a>. All rights reserved.
</p>

<hr>

# Ecommerce backend

This project was generated with [Node.js](https://nodejs.org/en) 22.11.0, [NPM](https://nodejs.org/en) version 10.9.0 
and PostgreSQL database with [PG Admin 4](https://www.postgresql.org/) version 17.2-1 and its dependencies are:

| Dependency         | Version |
| ------------------ | :------ |
| bcrypt             | 5.1.1   |
| cors               | 2.8.5   |
| dotenv             | 16.4.5  |
| exceljs            | 4.4.0   |
| express            | 4.21.0  |
| express-rate-limit | 7.5.0   |
| jsonwebtoken       | 9.0.2   |
| multer             | 1.4.5   |
| nodemailer         | 6.9.15  |
| pg                 | 8.13.0  |
| pg-hstore          | 2.3.4   |
| sequelize          | 6.37.3  |
| uuid               | 10.0.0  |
| validator          | 13.12.0 |
| winston            | 3.14.2  |

| Dev dependency   | Version |
| ---------------- | :------ |
| nodemon          | 3.1.7   |
| sequelize-cli    | 6.6.2   |

## How to create a project in express?

For documentation purposes, this repository was created as follows:

|  #  | Step                                        | Command                                |
| --- | :------------------------------------------ | :------------------------------------- |
| 1-  | Create a folder                             | N/A                                    |
| 2-  | Inside the folder initialize node           | `npm init -y`                          |
| 3-  | Install express                             | `npm install express`                  |
| 4-  | Create the .gitignore file                  | N/A                                    |
| 5-  | Create the environment variables            | `npm install dotenv`                   |
| 6-  | Create .env file (more information below)   | N/A                                    |
| 7-  | Create server.js file                       | N/A                                    |
| 8-  | Install cors                                | `npm install cors`                     |
| 9-  | Install nodemon                             | `npm install --save-dev nodemon`       |
| 10- | Put in package.json, scripts section        | `"start": "nodemon server.js",`        |
| 11- | Install sequelize and postgreSQL database   | `npm install sequelize pg pg-hstore`   |
| 12- | Install sequelize cli                       | `npm install --save-dev sequelize-cli` |
| 13- | Init sequelize                              | `npx sequelize-cli init`               |
| 14- | Install bcrypt to hass the passwords        | `npm install bcrypt`                   |
| 15- | Install JWT                                 | `npm install jsonwebtoken`             |
| 16- | Install JTI for JWT                         | `npm install uuid`                     |
| 17- | Install Winston for error.log file          | `npm install winston`                  |
| 18- | Install nodemailer for send emails          | `npm install nodemailer`               |
| 19- | Install validator to validate fields        | `npm install validator`                |
| 20- | Install exceljs to genere xlsx reports      | `npm install exceljs`                  |
| 21- | Install multer to upload and store files    | `npm install multer`                   |
| 22- | Install sharp to resize photos              | `npm install sharp`                    |
| 23- | Install express rate to limit the requests  | `npm install express-rate-limit`                    |
| 24- | Deploy the proyect                          | `npm run`                              |

### Parameters for the .env file

The environment variables used in this project are as follows:

```sh
BASE_URL=http://localhost:3000

API_URL=http://localhost:4200
SUPPORT_EMAIL=email@gmail.com
SUPPORT_WHATSAPP=57317*******

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shop-database
DB_USER=postgres
DB_PASSWORD=Pa22w0rd

# To generate the secrets randomly use this command
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
JWT_ACCESS_SECRET=8ffce1fbb5dd4600eae56c0e004ad818e05d90188281f334d053275dcd9aa415
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET=2eb7f58ae77fec57c01b7d6698c421ab457253451640a354ff9620cf77a5fad6
JWT_REFRESH_EXPIRATION=30d

# JWT to activate account
JWT_ACTIVATION_SECRET=a47393a08e69729ba36435dd59ba882001ba24946ea66639eeae9c5495846b76
JWT_ACTIVATION_EXPIRATION=2d

# To get HOST_PASSWORD, in Google account settings, look for App passwords (IMPORTANT ENABLE 2-STEP VERIFICATION)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_HOST_USER=email@gmail.com
EMAIL_HOST_PASSWORD=<HOST-PASSWORD>

# Roles
SUPER_ADMIN=1
ADMIN=2
CUSTOMER=3

# Storage uploads
AVATAR_PATH=../storage-uploads/profile-images
CATEGORY_PATH=../storage-uploads/category-images
```

⚠️ **Waring**: This data is fictitious and does not match the implementation in the production environment.

### Setting up sequelize for database migrations

When Sequelize is initialized, several files and folders are automatically generated. However, in order to integrate the environment variables into the configuration, it is necessary to convert the config.json file to config.ts. Additionally, in the index.js file, where the configuration import is performed, the extension must also be adjusted to correctly point to .ts instead of .json. Below are the commands to manage database migrations:

| Command                                                    | What it does?             |
| ---------------------------------------------------------- | :------------------------ |
| `npx sequelize-cli migration:create --name migration-name` | Create the migration file |
| `npx sequelize-cli db:migrate`                             | Run the migration         |
| `npx sequelize-cli db:migrate:undo`                        | Revert the migration      |
| `npx sequelize-cli db:migrate:undo:all`                    | Revert all migrations     |

<hr>

<p align="center">
    &copy; 2025 <a href="https://YouTube.com/@RubianoAndy" target="_blank" class="hover:underline">Andy Rubiano™ - International company</a>. All rights reserved.
</p>