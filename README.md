# wcomponent
```html
<element name='wc-login'>
  <template>
    <form autocomplete="off" novalidate>
      <p>
        <label>User Name</label>
        <input data-model='username' type='text'>
      </p>
      <p>
        <label>Password</label>
        <input data-model='password' type='password'>
      </p>
      <p>
        <button type="submit">Login</button>
      </p>
    </form>
  </template>
  <script>
    WComponent('wc-login', {
      callbacks: {
        created: function(){
          console.log('created;login')
        }
      },
      model: {
        username: 'somnath-kokane',
        password: 'wcomponent'
      },
      events: {
        onSubmit: function(){
          //
        }
      }
    });
  </script>
</element>

<wc-login></wc-login>

```
