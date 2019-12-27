## Getting started

```bash
docker-compose up --build
```

> [RabbitMQ Dashbord](http://localhost:15672/#/queues)
  Login: `guest`
  Password: `guest`


## Examples of usin API

```
curl localhost:3000/api/warehouse/items
curl localhost:3000/api/warehouse/items/ck4ljnt7j0000rcc1xm6qd1m3
curl -X POST -H 'Content-Type: application/json' -d '{"name": "Masalam3", "amount": 10, "price": 110}' localhost:3000/api/warehouse/items
curl -X PUT localhost:3000/api/warehouse/items/ck4ljnt7j0000rcc1xm6qd1m3/addition/100
curl localhost:3000/api/orders
curl localhost:3000/api/orders/ck4mhwku10000q5c1sxivsov3
curl -X POST localhost:3000/api/orders/ck4mhwku10000q5c1sxivsov3/item/ck4ljnt7j0000rcc1xm6qd1m3
curl -X PUT localhost:3000/api/orders/ck4mhwku10000q5c1sxivsov3/payment
curl -X PUT localhost:3000/api/orders/ck4mhwku10000q5c1sxivsov3/status/COMPLETE
```


## API

Name: **Get items**  
Method: `GET`
Path: `api/warehouse/items`  
Parameters:  
Input:  
Returns: коллекцию объектов представляющих товар (ItemDto), обязательные поля: идентификатор (id: integer), наименование (name: string), количество доступных для заказа (amount: integer), цена (price: double precision)  
Invariants:  

Name: **Get item by id**  
Method: `GET`  
Path: `api/warehouse/items/{item_id}`  
Parameters: not null {item_id} - идентификатор товара  
Input:  
Returns:  
ItemDto {id, name, amount, price}  
Invariants:  
  
Name: **Create item**  
Method: `POST`  
Path: `api/warehouse/items`  
Parameters:  
Input: ItemCreationDto {name, amount, price}  
Returns:  
ItemDto {id, name, amount, price}  
Invariants:  
До вызова объект не существует в базе данных, после вызова количество товаров с данным идентификатором становится равно amount  
  
Name: **Add existing items**  
Method: `PUT`  
Path: `api/warehouse/items/{id}/addition/{amount}`  
Parameters: id - идентификатор товара, 0 > amount > 10_000 - количество добавляемых товаров  
Input:  
Returns: ItemDto {id, name, amount} - обновленное состояние объекта  
Invariants:  
  
Name: **Get orders**  
Method: `GET`  
Path: `api/orders`  
Parameters:  
Input:  
Returns: коллекцию объектов представляющих заказ (OrderDto), обязательные поля: идентификатор (id: integer), статус заказа (status {COLLECTING, PAYED, SHIPPING, COMPLETE, FAILED, CANCELLED} : string/enum ), суммарная стоимость (totalCost: money), количество товаров в заказе (totalAmount: integer), идентификатор пользователя (username: string), коллекция объектов представляющих товар (ItemDto[]).  
Invariants:  
  
Name: **Get order by id**  
Method: `GET`  
Path: `api/orders/{order_id}`  
Parameters: not null {order_id} - идентификатор заказа  
Input:  
Returns:  OrderDto {id, status, username, totalCost, totalAmount, ItemDto[]} - актуальное состояние объекта.  
Invariants:  
  
Name: **Add item to order**  
Method: `POST`  
Path: `api/orders/{order_id}/item/{item_id}`  
Parameters: nullable {order_id} - идентификатор заказа, {item_id} - id of item to add  
Returns:  
OrderDto { id } - как минимум идентификатор заказа, которому была добавлена деталь.  
Invariants:  
если переданный идентификатор заказа null, то в результате вызова в базе данных создается новый заказ и его идентификатор возвращается клиенту  
после вызова заказ содержит товары, которые содержал до вызова и новый товар с характеристиками, переданными в ItemAdditionParametersDto  
после вызова количество доступных товаров с данным идентификатором становится меньше на amount, но не может стать меньше нуля.  
  
Name:  **Perform payment**  
Method: `PUT`  
Path: `api/orders/{order_id}/payment`  
Parameters: not null {order_id} - идентификатор заказа  
Input: UserDetailsDto {username, cardAuthorizationInfo {AUTHORIZED, UNAUTHORIZED}: string/enum} - оплата производится в зависимости от статуса карты.  
Returns:  
OrderDto { id } - как минимум идентификатор заказа.  
Invariants:  
статус заказа меняется в соответствие с машиной состояний в зависимости от результата вызова  
в случае неуспешной попытки количество доступных товаров, которые были включены в данный заказ, увеличивается на количество их в заказе  
  
Name: **Change order status**  
Method: `PUT`  
Path: `api/orders/{order_id}/status/{status}`  
Parameters: not null {order_id} - идентификатор заказа, not null {status} - {COLLECTING, PAID, SHIPPING, COMPLETE, FAILED, CANCELLED} - статус, в который переводится заказ.  
Input:  
Returns: OrderDto {id, status} - как минимум идентификатор и статус заказа  
Invariants:  
статус заказа меняется в соответствии с машиной состояний в зависимости от результата вызова  
в случае перевода в состояния {FAILED, CANCELLED} количество доступных товаров, которые были включены в данный заказ, увеличивается на количество их в заказе  
