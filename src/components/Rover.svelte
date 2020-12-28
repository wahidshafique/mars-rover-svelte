<script lang="ts">
  import Tiles from '../assets';
  import { getRoverDirection } from '../logic/roverDetails';
  import type { RoverAngle } from '../logic/types';
  export let title: string;
  export let row: number;
  export let col: number;
  // angle represented by degrees of where the rover is facing
  export let angle: RoverAngle;
</script>

<div class="absolute top-0">
  <img
    style="{`transform: rotate(${angle}deg)`}"
    class="{`ml-3 mt-3`}"
    src="{Tiles.rover}"
    title="{`${title}-${row}-${col}-${getRoverDirection(angle)}`}"
    alt="rover"
  />
</div>
