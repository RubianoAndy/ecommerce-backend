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

This project was generated with this dependencies:

| dependencies                    | Version |
| ------------------------------- | :------ |
| `Python`                        | 3.12.4  |
| `pip`                           | 24.1.2  |
| `Django`                        | 5.0.6   |
| `django-cors-headers`           | 4.4.0   |
| `djangorestframework`           | 3.15.2  |
| `djangorestframework-simplejwt` | 5.3.1   |
| `psycopg2-binary`               | 2.9.9   |
| `PyJWT`                         | 2.9.0   |
| `tzdata`                        | 2024.1  |

## Initial install

For documentation purposes, this repository was created as follows:

|  #  | Step                                        | Command                                |
| --- | :------------------------------------------ | :------------------------------------- |
| 1-  | Create a folder                             | N/A                                    |
| 2-  | Inside the folder initialize node           | `npm init -y`                          |
| 3-  | Install express                             | `npm install express`                  |
| 4-  | Create the environment variables            | `npm install dotenv`                   |
| 5-  | Create .env file (more information below)   | N/A                                    |
| 6-  | Create server.js file                       | N/A                                    |
| 7-  | Install cors                                | `npm install cors`                     |
| 8-  | Install sequelize and postgreSQL database   | `npm install sequelize pg pg-hstore`   |
| 9-  | Install sequelize cli                       | `npm install --save-dev sequelize-cli` |
| 10- | Init sequelize                              | `npx sequelize-cli init`               |
| 11- | Install bcrypt to hass the passwords        | `npm install bcrypt`                   |
| 12- | Install JWT                                 | `npm install jsonwebtoken`             |
| 13- | Install JTI for JWT                         | `npm install uuid`                     |

### Parameters for the .env file

The environment variables used in this project are as follows:

```sh
SERVER_PORT=3000

API_URL=http://localhost:4200

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shop-database
DB_USER=postgres
DB_PASSWORD=Pa22w0rd

# Para generar los secretos de forma aleatoria usar este comando
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
JWT_ACCESS_SECRET=8ffce1fbb5dd4600eae56c0e004ad818e05d90188281f334d053275dcd9aa415
JWT_REFRESH_SECRET=2eb7f58ae77fec57c01b7d6698c421ab457253451640a354ff9620cf77a5fad6
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=30d
```

> ⚠️ **Waring**: This data is fictitious and does not match the implementation in the production environment.
