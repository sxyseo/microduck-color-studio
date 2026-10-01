import {describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {Viewer} from '../src/viewer';
function viewer() {
  const a=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  const b=a.clone();const group=new THREE.Group();group.add(a,b);
  return {meshes:new Map([['a',a],['b',b]]),origins:new Map([['a',new THREE.Vector3()],['b',new THREE.Vector3()]]),ground:new THREE.Mesh(),simulationGrid:new THREE.GridHelper(),camera:new THREE.PerspectiveCamera(),controls:{target:new THREE.Vector3()},model:{bounds:[[0,-1,0],[1,1,1]]},posing:false,group,center:new THREE.Vector3(),size:1,view:vi.fn(),select:vi.fn()};
}
describe('embedding controls',()=>{
  it('rejects invalid part groups atomically',()=>{
    const v=viewer();
    expect(()=>Viewer.prototype.showParts.call(v as unknown as Viewer,['a','unknown'])).toThrow();
    expect(v.meshes.get('b')!.visible).toBe(true);
    Viewer.prototype.showParts.call(v as unknown as Viewer,['a']);
    expect(v.meshes.get('b')!.visible).toBe(false);
    Viewer.prototype.showParts.call(v as unknown as Viewer,null);
    expect(v.meshes.get('b')!.visible).toBe(true);
  });
  it('applies complete poses and resets them without changing geometry',()=>{
    const v=viewer();const matrix=new THREE.Matrix4().makeTranslation(10,20,30).toArray();
    Viewer.prototype.setPose.call(v as unknown as Viewer,{a:matrix,b:matrix});
    expect(v.meshes.get('a')!.position.toArray()).toEqual([10,20,30]);
    expect(v.ground.position.y).toBe(0);
    expect(v.simulationGrid.visible).toBe(true);
    const translated=new THREE.Matrix4().makeTranslation(30,20,30).toArray();
    Viewer.prototype.setPose.call(v as unknown as Viewer,{a:translated,b:translated});
    expect(v.camera.position.x).toBe(20);
    Viewer.prototype.setPose.call(v as unknown as Viewer,null);
    expect(v.meshes.get('a')!.position.toArray()).toEqual([0,0,0]);
    expect(v.simulationGrid.visible).toBe(false);
  });
  it('rejects partial or non-finite frames before mutating meshes',()=>{
    const v=viewer();const matrix=new THREE.Matrix4().toArray();
    for(const pose of [{a:matrix},{a:matrix,b:[NaN,...matrix.slice(1)]},{a:matrix,b:[...matrix.slice(0,15),0]}]){
      expect(()=>Viewer.prototype.setPose.call(v as unknown as Viewer,pose)).toThrow();
      expect(v.meshes.get('a')!.position.toArray()).toEqual([0,0,0]);
    }
  });
});
