<style global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>

<script>
  import Grid from './components/Grid.svelte';
  import GridCommand from './components/GridCommand.svelte';
</script>

<div>
  <div class="font-inter">
    <div class="text-center">
      <h1 class="text-4xl">Mars Rover Controls</h1>
    </div>
  </div>
  <GridCommand />
  <Grid />
</div>
