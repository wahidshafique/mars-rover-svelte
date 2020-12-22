<script>
  import Tiles from '../assets';
  export let title;
  // orientation represented by degrees of where the rover is facing
  export let orientation;
  console.log(1111, orientation);
</script>

<div class="absolute top-0">
  <img
    style="{`transform: rotate(${orientation}deg)`}"
    class="{`ml-3 mt-3`}"
    src="{Tiles.rover}"
    alt="rover"
    title="{title}"
  />
</div>
