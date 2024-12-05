FROM node:16 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:5001
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]