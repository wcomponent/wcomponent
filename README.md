# wcomponent
```html
<element name='wc-login'>
  <template>
    <p>
      <label>User Name</label>
      <input data-model='username' type='text'>
    </p>
    <p>
      <label>Password</label>
      <input data-model='password' type='password'>
    </p>
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
      }
    });
  </script>
</element>

<wc-login></wc-login>

```
