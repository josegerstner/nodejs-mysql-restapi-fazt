# [Nodejs MySQL REST API, Desde cero a Despliegue por Fazt](https://www.youtube.com/watch?v=3dSkc-DIM74)
  
Esta aplicación es para hacer el backend.  

### Configuración del proyecto
  
Primero creamos una carpeta y dentro ejecutamos el comando  
```
npm init -y
```  
Instalamos Express  
```  
npm i express
```  
Creamos el archivo _index.js_ y agregamos el siguiente texto  
```  
import express from 'express'  
const app = express()  
app.listen(3000)  
```  
Para que esto funcione, hay que agregar en cualquier parte del package.json
```  
"type": "module"
```  
Para ejecutar el código podemos poner en la consola **node index.js**, pero esto deberíamos pararlo y ejecutarlo cada vez que realicemos cambios en el código. Para que esto no pase, instalamos nodemon como dependencia de desarrollo
```  
npm i nodemon -D
```  
Y luego agregamos como script en el _package.json_ 
```  
"dev": "node index.js"
```  
para poder ejecutar **npm run dev** en la terminal.  
  
### Endpoints
Los endpoints serían las rutas donde puedo hacer las consultas de la API  
Para probar, podemos agregar en **index.js**
```
app.get('/employees', (req, res)=> res.send("Obteniendo empleados"))
app.post('/employees', (req, res)=> res.send("Creando empleados"))
app.put('/employees', (req, res)=> res.send("Actualizando empleados"))
app.delete('/employees', (req, res)=> res.send("Eliminando empleados"))
```
y luego hacer las consultas con *Postman* o algún programa similar  
  
### Conexión a la base de datos
Ya deberíamos tener **MySQL** instalado o tener acceso al entorno donde vamos a conectarnos. Luego creamos una carpeta *db* y dentro un archivo *database.sql* donde escribimos la creación de la base de datos y las tablas necesarias.  
Instalamos desde la terminal **mysql2** para conectar el código de node con la bbdd
```
npm i mysql2
```
Luego creamos un archivo _db.js_ donde tendremos que configurar la conexión. En este caso llamaremos a createPool para tener un conjunto de conexiones a la base de datos, createConnection nos permite una sola conexión. Importamos createPool y creamos y exportamos el objeto conexión:
```
import { createPool } from 'mysql2/promise'

export const pool = createPool({
    host: 'localhost',
    user: 'user',
    password: 'contrasenia',
    port: 3306,
    database: 'nombre_de_la_base_de_datos'
})
```
Ya hecha la conexión, sólo tenemos que agregar un par de líneas de código en index.js a ver si se conecta con la base de datos

### Routes del servidor
Tener todo dentro del archivo index queda desprolijo, por lo que vamos a organizar un poco el proyecto. Creamos una carpeta _src_ y metemos los archivos _index.js_ y _db.js_. También dentro de la carpeta _src_ creamos otra carpeta llamada _routes_ donde estará nuestro código de consultas a la bbdd.  
Recordar cambiar en el _package.json_ el script para que apunte al "nuevo" index: "dev": "nodemon src/index.js"  
  
Dentro de la carpeta routes creamos un archivo _employees.routes.js_ y llevamos nuestras rutas /employee (get/put/post/delete) desde el archivo index a este archivo. Quedando el mismo:
```
import { Router } from 'express'

const router = Router()

router.get('/employees', (req, res)=> res.send("Obteniendo empleados"))

router.post('/employees', (req, res)=> res.send("Creando empleados"))

router.put('/employees', (req, res)=> res.send("Actualizando empleados"))

router.delete('/employees', (req, res)=> res.send("Eliminando empleados"))

export default router
```

También creamos otro archivo al que llamaremos _index.routes.js_ que será donde llevemos el pool creado en _index.js_ anteriormente
```
import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

router.get('/ping', async (req, res)=> {
    const [result] = await pool.query('SELECT "pong" as result')
    res.json(result[0])
})

export default router
```
El index.js por el momento:
```
import express from 'express'
import employeesRoutes from './routes/employees.routes.js'
import indexRoutes from './routes/index.routes.js'

const app = express()

app.use(employeesRoutes)
app.use(indexRoutes)

app.listen(3000)

console.log("Server running on port 3000")
```

### Controladores
Creamos una carpeta _controllers_ en _src_ donde pondremos las consultas, validaciones, etc. que también podrían llegar a reutilizarse en cada una de las routes  
Entonces creamos el archivo _employee.controller.js_ y vamos cortando y pegando las funciones de cada ruta en este archivo y exportando cada una como una constante. 
```
export const getEmployees = (req, res)=> res.send("Obteniendo empleados")
export const createEmployee = (req, res)=> res.send("Creando empleados")
export const updateEmployee = (req, res)=> res.send("Actualizando empleados")
export const deleteEmployee = (req, res)=> res.send("Eliminando empleados")
```
Mientras, en el archivo _employee.routes.js_ vamos referenciando cada función.
```
...
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../controllers/employees.controller.js'
...
router.get('/employees', getEmployees)
router.post('/employees', createEmployee)
router.put('/employees', updateEmployee)
router.delete('/employees', deleteEmployee)
...
```
Hacemos lo mismo para index  
  
### POST employees
Ya teniendo armado el esqueleto de la aplicación, podemos empezar a cambiar las funciones de los controladores para que hagan lo que realmente necesitamos.
En el archivo _employees.controller.js_ importamos el **pool** creado en el archivo _db.js_. Vamos a la función createEmployee y cambiamos su contenido
```
export const createEmployee = async (req, res) => {
    const {name, salary} = req.body
    const [rows] = await pool.query('INSERT INTO employee (name, salary) VALUES (?,?)', [name, salary])
    res.send({
        id: rows.insertId,
        name,
        salary
    })
}
```
Si probamos enviar esta petición con su respectivo contenido, nos va a dar error, ya que necesitamos que nuestra aplicación reconozca los json con los que trabajaremos. Para esto hay que agregar una línea en el archivo _index.js_
```
app.use(express.json())
```
De esta manera le decimos al servidor que nos manejaremos de esta manera.  
  
### GET employees
  
Ya viendo en el punto anterior el POST de los employees, se nos hará más fácil entender esta parte.  
Debemos cambiar la función getEmployees del controlador:
```
export const getEmployees = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM employee')
    res.json(rows)
}
```
También cambiaremos la url donde trabajamos con la api, sólo para que quede bien. Ahora estamos trabajando en una url "localhost:3000/employees", vamos a cambiarla a "localhost:3000/api/employees". Esto podemos hacerlo en el archivo _index.js_ cambiando la línea
```
app.use('/api',employeesRoutes)
```

### GET employee by ID
  
Esta función será, en principio, parecida a la anterior, pero en lugar de devolverme todos los resultados, me devolverá uno en concreto.  
En la query podemos ver que le pasamos el id del employee que quiero como parámetro. Luego decimos que si no nos devolvió ningún registro, no nos de el status 200 (que sería ok), sino que nos devuelva un estado 404 con un mensaje personalizado. Al final retornamos lo que nos devolvió la query. Como devuelve un objeto y sabemos que sólo devolverá un solo resultado, tomamos la posición 0 de ese objeto 
```
export const getEmployee = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM employee WHERE id = ?', [req.params.id])
    if (rows.length <= 0) return res.status(404).json({
        message: 'Employee not found'
    })
    res.json(rows[0])
}
```  
Recordar también que hay que agregar la ruta correspondiente en el archivo _employee.routes.js_ con el parámetro id  
  
### DELETE employee  
  
En este caso el código será parecido a la función anterior, pero en lugar de retornar un employee a través de su id, lo estaremos eliminando. Notar que no estamos recibiendo _rows_ de la query como en la función anterior, sino que estamos recibiendo un result con distintos atributos. Usaremos el atributo **affectedRows** para ver si se eliminó uno o ningún registro. En caso de no haber eliminado ningún registro, retornaremos el estado de error 404. En cambio, si eliminó un registro, retornaremos el estado 204. Este estado significa que la consulta se ejecutó satisfactoriamente, pero el servidor no devuelve ningún mensaje al cliente.  
```
export const deleteEmployee = async (req, res) => {
    const [result] = await pool.query('DELETE FROM employee WHERE id = ?', [req.params.id])

    if (result.affectedRows <= 0) return res.status(404).json({
        message: 'Employee not found'
    })

    res.sendStatus(204)
}
```  
Recordar también que hay que agregar la ruta correspondiente en el archivo _employee.routes.js_ con el parámetro id  
  
### PATCH employee  
  
En esta función usaremos todo lo aprendido anteriormente, ya que deberemos agregar el parámetro id en la ruta como en los casos anteriores. También sabemos que el query retornará un array [result] con uno de sus atributos affectedRows, el cual usaremos para devolver un estado 404 si no hay filas afectadas. Además, volveremos a hacer una consulta a la base de datos para ver el registro actualizado. Esto nos devolverá un array [rows] del cual usaremos sólo la primer fila, la cual retornaremos.
Para cerrar, tenemos un problema con los campos que quiero actualizar. Si siempre voy a actualizar todos los datos del registro, lo normalizado es usar el método **PUT** para las rutas, en cambio, si quiero actualizar sólo algunos campos, la norma dice que debo usar **PATCH** para que el cliente sepa (por norma, en realidad se puede actualizar algunos campos con PUT y todos los campos con PATCH). Ahora, el problema sería enviar sólo algunos datos para actualizar el registro. Cuando envío sólo algunos datos, los demás datos se envían igual pero como _undefined_, lo que produciría que se pisen esos datos no enviados en la base de datos con _NULL_. Para solucionar esto, decidimos usar el método **PATCH** en la ruta para que el cliente sepa que puede enviar algunos datos y agregar en nuestra query **IFULL(?, campo)**. De esta manera, decimos que si el valor que envío es nulo, no lo actualice, o mejor dicho, que lo pise con el dato que ya está en la base de datos.  
La ruta quedaría así
```  
router.patch('/employees/:id', updateEmployee)
```  
El controlador se vería de la siguiente manera
```  
export const updateEmployee = async (req, res) => {
    const {id} = req.params
    const {name, salary} = req.body
    const [result] = await pool.query("UPDATE employee SET name = IFNULL(?, name), salary = IFNULL(?, salary) WHERE id = ?", [name, salary, id])
    if (result.affectedRows === 0) return res.status(404).json({
        message: 'Employee not found'
    })
    const [rows] = await pool.query('SELECT * FROM employee WHERE id = ?', [id])
    res.json(rows[0])
}
```  
  
### Manejo de errores
  
Si tenemos un error con las peticiones a la base de datos (como error de conexión con la base de datos, se cortó internet u otro error inesperado), nuestro código no está preparado, no estamos capturando los errores. Cuando ocurre esto, express deja de correr el servidor, lo cuel es un gran problema. Para esto, debemos agregar en las peticiones los try catch correspondientes. El getEmployees se vería así
```
export const getEmployees = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM employee')
        res.json(rows)
    } catch(error) {
        res.status(500).json({
            message: 'Something goes wrong'
        })
    }
}
```
Esto hay que replicar en cada una de las funciones del controlador.  
En lugar de usar try-catch se podría usar (express promise router)[https://www.npmjs.com/package/express-promise-router]  
  
### NOT FOUND
  
Si el cliente visita una página que no existe, el navegador recibe un HTML con un estado 404 not found. Para el navegador está bien, pero para aplicaciones cliente debería haber un mensaje en lugar del HTML.  
Para esto, en el archivo _index.js_ luego de las rutas (si la petición del cliente no encontró ninguna de las rutas anterioes), agregamos un middleware (entonces el cliente entrará acá). Este middleware responde con el estado 404 y un mensaje
```
app.use((req, res, next) => {
    res.status(404).json({
        message: 'endpoint not found'
    })
})
```
  
### Variables de entorno
  
En el archivo _db.js_ tenemos información sensible que no nos gustaría que se filtrase, para resolver esto usaremos variables de entorno. Para esto, necesitamos instalar el módulo **dotenv** desde la consola
```
npm i dotenv
```
Este módulo me permite leer las variables de entorno desde un archivo _.env_, donde por ejemplo tendremos una variable PORT seteada en 3000
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=userdebbdd
DB_PASSWORD=passdeluser
DB_DATABASE=nombre_de_bbdd
```
Para leer esta variable, necesitamos un archivo _config.js_ donde importamos el módulo **dotenv**
```
import { config } from 'dotenv'
config()
export const PORT = process.env.PORT || 3000
export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = process.env.DB_PORT || 3306
export const DB_USER = process.env.DB_USER
export const DB_PASSWORD = process.env.DB_PASSWORD
export const DB_DATABASE = process.env.DB_DATABASE
```
También cambiaremos en _db.js_
```
import { createPool } from 'mysql2/promise'
import { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_DATABASE } from './config.js'
export const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_DATABASE
})
```
Y por último, podemos separar todo lo que es la **app** para que no esté en el archivo _index.js_. Creamos _app.js_
```
import express, { json } from 'express'
import employeesRoutes from './routes/employees.routes.js'
import indexRoutes from './routes/index.routes.js'

const app = express()

app.use(express.json())

app.use(indexRoutes)
app.use('/api',employeesRoutes)

app.use((req, res, next) => {
    res.status(404).json({
        message: 'endpoint not found'
    })
})

export default app
```
_index.js_ quedaría así
```
import app from './app.js'
import { PORT } from './config.js'

app.listen(PORT)

console.log("Server running on port", PORT);
```
  
### Deploy en RAILWAY
  
Necesitamos tener la app en un repositorio (ver cómo hacerlo con Github)  
También necesitamos agregar un script en el _package.json_ para correr en producción. Quedaría así esa parte
```
...
"scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
...
```
Luego de subir todo a un repo público de Github, vamos a [Railway](https://railway.app/) y nos logueamos con Github.
Creamos un proyecto desde el repo de Github y una vez creado vamos a añadir variables.  
Antes de añadir las variables, creamos otro proyecto como **Provision MySQL**. Una vez creada, vamos a la parte de variables del proyecto MySQL y copiamos los datos que necesitamos mientras vamos creando las variables en el primer proyecto (server).  
Por último, vamos a nuestro archivo _database.sql_ y copiamos y ejecutamos en Railway la query para crear la tabla y luego copiamos e insertamos los datos.
Y listo. Ya podemos probar desde un programa como **Postman** las diferentes rutas y trabajar