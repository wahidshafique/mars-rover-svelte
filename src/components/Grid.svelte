<script>
  import Tiles from '../assets';
  console.log(Tiles.bottomCenter);
  const tile = [1, 2, 3, 3, 3];
</script>

<div>
  {#each tile as { src }, i}
    <div>test</div>
    <img src="{Tiles.bottomCenter}" />
  {/each}
</div>
