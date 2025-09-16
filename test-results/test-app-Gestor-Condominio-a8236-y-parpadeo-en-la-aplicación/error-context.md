# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - heading "Gestor Condominos" [level=1] [ref=e7]
      - paragraph [ref=e8]: Sistema de Gestión de Condominios
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Iniciar Sesión" [level=3] [ref=e11]
        - paragraph [ref=e12]: Ingresa tus credenciales para acceder al sistema
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Email
            - textbox "Email" [ref=e17]
          - generic [ref=e18]:
            - generic [ref=e19]: Contraseña
            - generic [ref=e20]:
              - textbox "Contraseña" [ref=e21]
              - button [ref=e22] [cursor=pointer]:
                - img [ref=e23] [cursor=pointer]
        - generic [ref=e26]:
          - button "Iniciar Sesión" [ref=e27] [cursor=pointer]
          - generic [ref=e28]:
            - link "¿Olvidaste tu contraseña?" [ref=e29] [cursor=pointer]:
              - /url: /forgot-password
            - paragraph [ref=e30]:
              - text: ¿No tienes cuenta?
              - link "Regístrate" [ref=e31] [cursor=pointer]:
                - /url: /register
  - region "Notifications alt+T"
```